import { Global, Module } from '@nestjs/common';
import { RequestContextModule } from '../context/request-context-service.module';
import { AppLogger } from './applogger';

@Global()
@Module({
  imports: [RequestContextModule],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
