import { Module } from '@nestjs/common';
import { RevokeUseCase } from './revoke-refresh-token.usecase';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { TokenModule } from 'src/modules/auth/infrastructure/service/token.module';

@Module({
  imports: [TokenModule, LoggerModule],
  providers: [RevokeUseCase],
  exports: [RevokeUseCase],
})
export class RevokeTokenModule {}
