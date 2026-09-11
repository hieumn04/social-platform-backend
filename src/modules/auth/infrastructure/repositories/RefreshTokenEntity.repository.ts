import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RefreshTokenRepository } from '../../domain/repositories/refreshToken.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../typeorm/refreshTokens.Entity';
import { EntityManager, Repository } from 'typeorm';
import { RefreshToken } from '../../domain/models/refreshToken';
import { RefreshTokenMapper } from '../mapper/refreshToken.mapper';

@Injectable()
export class RefreshTokenRepositoryImpl implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly ormRepo: Repository<RefreshTokenEntity>,
  ) {}

  async insert(token: RefreshToken, manager?: EntityManager): Promise<void> {
    const em = manager ?? this.ormRepo.manager;

    try {
      await em.insert(RefreshTokenEntity, RefreshTokenMapper.toEntity(token));
    } catch (err) {
      console.error('Insert refresh token error:', err);
      throw new InternalServerErrorException('Failed to insert refresh token', {
        cause: err as Error,
      });
    }
  }

  async findByJti(jti: string): Promise<RefreshToken | null> {
    const entity = await this.ormRepo.findOne({ where: { jti } });
    return entity ? RefreshTokenMapper.toDomain(entity) : null;
  }
  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    const entities = await this.ormRepo.find({
      where: { userId, isRevoked: false },
    });

    return entities
      .map((entity) => RefreshTokenMapper.toDomain(entity))
      .filter((token) => token.isActive);
  }

  async findByUserIpDevice(
    userId: string,
    deviceId: string | null,
    ipAddress: string | null,
  ): Promise<RefreshToken | null> {
    const qb = this.ormRepo
      .createQueryBuilder('refreshToken')
      .where('refreshToken.userId = :userId', { userId });

    if (deviceId === null) {
      qb.andWhere('refreshToken.deviceId IS NULL');
    } else {
      qb.andWhere('refreshToken.deviceId = :deviceId', { deviceId });
    }

    if (ipAddress === null) {
      qb.andWhere('refreshToken.ipAddress IS NULL');
    } else {
      qb.andWhere('refreshToken.ipAddress = :ipAddress', { ipAddress });
    }
    const entity = await qb.getOne();

    return entity ? RefreshTokenMapper.toDomain(entity) : null;
  }

  async markRevoked(jti: string, manager?: EntityManager): Promise<void> {
    const em = manager ?? this.ormRepo.manager;
    await em.update(RefreshTokenEntity, { jti }, { isRevoked: true });
  }

  async rotate(
    oldToken: RefreshToken,
    newToken: RefreshToken,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager ?? this.ormRepo.manager;

    await em.update(
      RefreshTokenEntity,
      { id: oldToken.id },
      { isRevoked: true, rotatedAt: new Date() },
    );

    await em.insert(RefreshTokenEntity, RefreshTokenMapper.toEntity(newToken));
  }

  async deleteByJti(jti: string, manager?: EntityManager): Promise<void> {
    const em = manager ?? this.ormRepo.manager;
    await em.delete(RefreshTokenEntity, { jti });
  }
}
