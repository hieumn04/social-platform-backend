import { Module } from '@nestjs/common';
import { MessageFanoutService } from './message-fanout.service';
import { SocketIoWsEmitterModule } from '@/modules/chat/infrastructure/ws/socket-io-ws-emitter.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { PushNotificationModule } from '@/modules/notification/notification.module';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';
import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';

@Module({
  imports: [
    LoggerModule,
    SocketIoWsEmitterModule,
    PushNotificationModule,
    ConversationPersistenceModule,
    RedisClusterModule,
  ],
  providers: [
    {
      provide: 'MessageFanout',
      useClass: MessageFanoutService,
    },
  ],
  exports: ['MessageFanout'],
})
export class MessageFanoutModule { }
