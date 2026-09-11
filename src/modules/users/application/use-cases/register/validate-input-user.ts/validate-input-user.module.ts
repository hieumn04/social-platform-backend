import { Module } from '@nestjs/common';

import { UserPersistenceModule } from 'src/modules/users/infrastructure/repositories/user-persistence.module';
import { ValidateInputUserUseCase } from './validate-input-user.usecase';
import { LoggerModule } from 'src/shared/logger/logger.module';

@Module({
  imports: [UserPersistenceModule, LoggerModule],
  providers: [ValidateInputUserUseCase],
  exports: [ValidateInputUserUseCase],
})
export class ValidateInputUserModule {}
