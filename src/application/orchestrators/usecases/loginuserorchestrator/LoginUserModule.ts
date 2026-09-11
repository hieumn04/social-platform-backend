import { Module } from '@nestjs/common';
import { GenerateTokenPairModule } from 'src/modules/auth/application/register/generatetokenpair.module';
import { LoginModule } from 'src/modules/users/application/use-cases/login/login.module';
import { LoginUserUseCases } from './LoginUserUseCases';

@Module({
  imports: [LoginModule, GenerateTokenPairModule],

  providers: [LoginUserUseCases],
  exports: [LoginUserUseCases],
})
export class LoginUserModule {}
