import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { UserIdentityEntity } from '@/modules/users/infrastructure/typeorm/user-identity.entity';
import { UserIdentityRepositoryImpl } from '@/modules/users/infrastructure/repositories/user-identity-persistence.repository';
import { DatabaseModule } from '@/shared/database/database.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserIdentityEntity]),
    DatabaseModule,
    LoggerModule,
  ],
  providers: [
    {
      provide: 'UserIdentityRepository',
      useClass: UserIdentityRepositoryImpl,
    },
  ],
  exports: ['UserIdentityRepository', TypeOrmModule],
})
export class UserIdentityPersistenceModule {}
