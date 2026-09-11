import { GenerateUserIdentityUseCase } from '@/modules/users/application/use-cases/create-user-identity/create-user-identity.usecase';
import { UserIdentityPersistenceModule } from '@/modules/users/infrastructure/repositories/userIdentity-persistence.module';
import { SnowflakeIdModule } from '@/shared/snowflake-generator/snowflakeId-generator.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [SnowflakeIdModule, UserIdentityPersistenceModule],
  providers: [GenerateUserIdentityUseCase],
  exports: [GenerateUserIdentityUseCase],
})
export class UserIdentityModule {}
