import { Module } from '@nestjs/common';
import { CreateNewUserUseCase } from './createnewUser.usecase';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { UserPersistenceModule } from 'src/modules/users/infrastructure/repositories/user-persistence.module';
import { SnowflakeIdModule } from '@/shared/snowflake-generator/snowflakeId-generator.module';

@Module({
  imports: [UserPersistenceModule, SnowflakeIdModule, LoggerModule],
  providers: [CreateNewUserUseCase],
  exports: [CreateNewUserUseCase],
})
export class CreateNewUserModule {}
