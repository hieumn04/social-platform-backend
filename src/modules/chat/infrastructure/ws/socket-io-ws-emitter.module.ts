import { SocketGatewayModule } from '@/modules/chat/gateway/socket-gateway.module';
import { SocketIoWsEmitter } from '@/modules/chat/infrastructure/ws/socket-io-ws-emitter';

import { LoggerModule } from '@/shared/logger/logger.module';

import { Module } from '@nestjs/common';

@Module({
  imports: [LoggerModule, SocketGatewayModule],
  providers: [
    {
      provide: 'WsEmitter',
      useClass: SocketIoWsEmitter,
    },
  ],
  exports: ['WsEmitter'],
})
export class SocketIoWsEmitterModule {}
