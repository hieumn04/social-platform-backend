import { MarkSeenUseCase } from '@/modules/coversation/application/use-cases/mark-seen/mark-seen.usecase';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';
import { MessagePersistenceModule } from '@/modules/message/infrastructure/repositories/message-persistence.module';
import { SocketIoWsEmitterModule } from '@/modules/chat/infrastructure/ws/socket-io-ws-emitter.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';
import { Module } from '@nestjs/common';


@Module({
  imports: [
    ConversationPersistenceModule,
    MessagePersistenceModule,
    SocketIoWsEmitterModule,
    RedisClusterModule,
    LoggerModule,
  ],
  providers: [MarkSeenUseCase],
  exports: [MarkSeenUseCase],
})
export class MarkSeenModule { }
