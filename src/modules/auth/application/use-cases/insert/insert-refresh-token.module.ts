import { Module } from '@nestjs/common';
import { RefreshPersistenceModule } from 'src/modules/auth/infrastructure/repositories/refresh-persistence.module';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { InsertRefreshTokenUseCase } from './insert-refresh-token.usecase';

@Module({
  imports: [RefreshPersistenceModule, LoggerModule],
  providers: [InsertRefreshTokenUseCase],
  exports: [InsertRefreshTokenUseCase],
})
export class InsertRefreshTokenModule {}
