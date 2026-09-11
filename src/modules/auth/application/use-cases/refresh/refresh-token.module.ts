import { Module } from '@nestjs/common';
import { RefreshUseCase } from './refresh-token.usecase';
import { TokenModule } from 'src/modules/auth/infrastructure/service/token.module';
import { LoggerModule } from 'src/shared/logger/logger.module';

@Module({
  imports: [TokenModule, LoggerModule],
  providers: [RefreshUseCase],
  exports: [RefreshUseCase],
})
export class RefreshTokenModule {}
