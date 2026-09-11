import { Module } from '@nestjs/common';

import { LoggerModule } from 'src/shared/logger/logger.module';
import { UserPersistenceModule } from 'src/modules/users/infrastructure/repositories/user-persistence.module';
import { LoginUseCase } from './login.usecase';

@Module({
  imports: [UserPersistenceModule, LoggerModule],
  providers: [LoginUseCase],
  exports: [LoginUseCase],
})
export class LoginModule {}
