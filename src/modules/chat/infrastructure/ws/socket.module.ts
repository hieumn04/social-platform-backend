import { Module } from '@nestjs/common';
import { SocketIoAdapter } from './socket-io.adapter';
import { AppLogger } from '@/shared/logger/applogger';
import { NestConfigService } from '@/shared/config/config.service';

@Module({
  providers: [SocketIoAdapter, AppLogger, NestConfigService],
  exports: [SocketIoAdapter],
})
export class SocketModule {}
