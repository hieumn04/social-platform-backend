import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/shared/logger/logger.module';

import { UserReadRepositoryImpl } from '@/modules/users/infrastructure/repositories/user-read-persistence.repository';
import { UserWriteRepositoryImpl } from '@/modules/users/infrastructure/repositories/user-write-persistence.repository';
import { DatabaseModule } from '@/shared/database/database.module';

import { UserEntity } from '@/modules/users/infrastructure/typeorm/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    DatabaseModule,
    LoggerModule,
  ],
  providers: [
    {
      provide: 'UserReadRepository',
      useClass: UserReadRepositoryImpl,
    },
    {
      provide: 'UserWriteRepository',
      useClass: UserWriteRepositoryImpl,
    },
  ],
  exports: ['UserReadRepository', 'UserWriteRepository'],
})
export class UserPersistenceModule {}
