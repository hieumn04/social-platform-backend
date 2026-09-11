import { Module } from '@nestjs/common';

import { LoggerModule } from 'src/shared/logger/logger.module';
import { CsrfGuard } from './csrf.guard';
import { TokenModule } from '../infrastructure/service/token.module';

@Module({
  imports: [TokenModule, LoggerModule],
  providers: [CsrfGuard],
  exports: [CsrfGuard, TokenModule],
})
export class CsrfGuardsModule {}
