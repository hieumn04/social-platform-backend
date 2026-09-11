import { FlushService } from '@/shared/flush/flush.service';
import { LoggerModule } from '@/shared/logger/logger.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [LoggerModule],
  providers: [FlushService],
  exports: [FlushService],
})
export class FlushModule {}
