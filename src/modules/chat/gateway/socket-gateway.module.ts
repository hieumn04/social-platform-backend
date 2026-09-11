import { ChatGateway } from '@/modules/chat/gateway/chat.gateway';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';
import { PresenceModule } from '@/shared/redis-cluster/presence/presence.module';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/shared/logger/logger.module';

@Module({
  imports: [ConversationPersistenceModule, LoggerModule, PresenceModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class SocketGatewayModule {}
