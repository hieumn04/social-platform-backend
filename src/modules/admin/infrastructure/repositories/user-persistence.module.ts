import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntityRepositoryImpl } from './userEntity.repository';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { AdminEntity } from '../typeorm/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity]), LoggerModule],
  providers: [
    {
      provide: 'UserRepository',
      useClass: UserEntityRepositoryImpl,
    },
  ],
  exports: ['UserRepository', TypeOrmModule],
})
export class AdminPersistenceModule {}
