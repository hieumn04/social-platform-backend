import { Module } from '@nestjs/common';

import { RefreshPersistenceModule } from './infrastructure/repositories/refresh-persistence.module';
import { UserVerificationLogPersistenceModule } from './infrastructure/repositories/userVerificationLog-persistence.modules';
import { AuthGuardsModule } from './guards/auth-guards.module';
import { RefreshTokenController } from './presentation/controller/refreshToken.controller';
import { InsertRefreshTokenModule } from './application/use-cases/insert/insert-refresh-token.module';
import { GenerateTokenPairModule } from './application/register/generatetokenpair.module';

@Module({
  imports: [
    RefreshPersistenceModule,
    // UserVerificationLogPersistenceModule,
    AuthGuardsModule,
    GenerateTokenPairModule,
    InsertRefreshTokenModule,
  ],

  exports: [AuthGuardsModule, GenerateTokenPairModule],
  controllers: [RefreshTokenController],
})
export class AuthModule {}
