import { Module } from '@nestjs/common';
import { ProductionMessageWorker } from '@/modules/message/infrastructure/workers/message.consumer';
import { ReadWatermarkWorker } from '@/modules/message/infrastructure/workers/read-watermark.consumer';
import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';
import { MessageFanoutModule } from '@/modules/message/infrastructure/service/message-fanout.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';
import { MessagePersistenceModule } from '@/modules/message/infrastructure/repositories/message-persistence.module';
import { MailBoxPersistenceModule } from '@/modules/mailbox/infrastructure/repositories/mailbox-persistence.module';
import { SocketIoWsEmitterModule } from '@/modules/chat/infrastructure/ws/socket-io-ws-emitter.module';

@Module({
  imports: [
    RedisClusterModule,
    MessageFanoutModule,
    LoggerModule,
    ConversationPersistenceModule,
    MessagePersistenceModule,
    MailBoxPersistenceModule,      // provides TypeormMailboxEventRepository
    SocketIoWsEmitterModule,
  ],
  providers: [ProductionMessageWorker, ReadWatermarkWorker],
  exports: [ProductionMessageWorker, ReadWatermarkWorker],
})
export class MessageWorkerModule {}
