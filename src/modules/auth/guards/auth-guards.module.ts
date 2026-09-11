import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './JwtAuthAccessGuard';
import { SessionGuard } from './JwtAuthRefreshGuard';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { SessionServiceModule } from '../domain/domain-service/session-service.module';
import { StrategiesModule } from '../strategies/strategies.module';
import { CsrfGuard } from './csrf.guard';
import { CsrfGuardsModule } from './csrf-guards.module';

@Module({
  imports: [
    StrategiesModule,
    CsrfGuardsModule,
    LoggerModule,
    SessionServiceModule,
  ],
  providers: [JwtAuthGuard, SessionGuard],
  exports: [JwtAuthGuard, SessionGuard],
})
export class AuthGuardsModule {}
