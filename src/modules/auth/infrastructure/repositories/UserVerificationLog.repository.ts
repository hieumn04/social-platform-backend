import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { UserVerificationLogRepository } from '../../domain/repositories/userVerificationLog.repository.interface';
import { UserVerificationLogsEntity } from '../typeorm/userVerificationLogs.entity';
import { UserVerificationLog } from '../../domain/models/user_verifications';
import { UserVerificationLogMapper } from '../mapper/userVerificationLog.mapper';
import { Method } from 'src/shared/enums/statusRegister.enum';

@Injectable()
export class UserVerificationLogRepositoryImpl
  implements UserVerificationLogRepository
{
  constructor(
    @InjectRepository(UserVerificationLogsEntity)
    private readonly ormRepo: Repository<UserVerificationLogsEntity>,
  ) {}

  async findById(id: string): Promise<UserVerificationLog | null> {
    const row = await this.ormRepo.findOneBy({ id });
    return row ? UserVerificationLogMapper.toDomain(row) : null;
  }

  async findRecentByUser(
    userId: string,
    limit?: number,
  ): Promise<UserVerificationLog[]> {
    const rows = await this.ormRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => UserVerificationLogMapper.toDomain(row));
  }

  async insert(
    log: UserVerificationLog,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager ?? this.ormRepo.manager;
    const persistence = UserVerificationLogMapper.toPersistence(log);

    try {
      await em.insert(UserVerificationLogsEntity, persistence);
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to insert user verification log',
        { cause: err as Error },
      );
    }
  }

  async insertMany(
    logs: UserVerificationLog[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!logs.length) return;

    const em = manager ?? this.ormRepo.manager;
    const values = logs.map((row) =>
      UserVerificationLogMapper.toPersistence(row),
    );

    try {
      await em.insert(UserVerificationLogsEntity, values);
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to insert user verification logs',
        { cause: err as Error },
      );
    }
  }

  async findLatestByUserAndPurpose(
    userId: string,
    purpose: Method,
  ): Promise<UserVerificationLog | null> {
    const row = await this.ormRepo.findOne({
      where: { userId, purpose },
      order: { createdAt: 'DESC' },
    });
    return row ? UserVerificationLogMapper.toDomain(row) : null;
  }
}
