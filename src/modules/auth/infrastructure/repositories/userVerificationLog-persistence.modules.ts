import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserVerificationLogRepositoryImpl } from './UserVerificationLog.repository';
import { UserVerificationLogsEntity } from '../typeorm/userVerificationLogs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserVerificationLogsEntity])],
  providers: [
    {
      provide: 'UserVerificationLogRepository',
      useClass: UserVerificationLogRepositoryImpl,
    },
  ],
  exports: ['UserVerificationLogRepository', TypeOrmModule],
})
export class UserVerificationLogPersistenceModule {}
