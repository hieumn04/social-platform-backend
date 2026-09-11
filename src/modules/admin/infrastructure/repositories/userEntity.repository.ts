import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { AppLogger } from 'src/shared/logger/applogger';

import { AdminEntity } from '../typeorm/admin.entity';
import { AdminRepository } from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/models/admin.model';
import { Email } from 'src/modules/value-objects/email';

@Injectable()
export class AdminEntityRepositoryImpl implements AdminRepository {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly ormRepo: Repository<AdminEntity>,
    private readonly logger: AppLogger,
  ) {}

  findById(adminId: string): Promise<Admin | null> {}
  findByEmail(email: Email): Promise<Admin | null> {}
}
