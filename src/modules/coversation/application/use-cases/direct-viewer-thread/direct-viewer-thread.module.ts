import { DirectViewerThreadUseCase } from '@/modules/coversation/application/use-cases/direct-viewer-thread/direct-viewer-thread.usecase';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';
import { SocialGraphPersistenceModule } from '@/modules/social-graph/infrastructure/repositories/follows-persistence.module';
import { UserPersistenceModule } from '@/modules/users/infrastructure/repositories/user-persistence.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';
import { Module } from '@nestjs/common';
import { MessagePersistenceModule } from '@/modules/message/infrastructure/repositories/message-persistence.module';
import { GetSlideMessageConnectionUseCase } from '@/modules/message/application/use-cases/slide-message/get-slide-messages.usecase';
import { GetThreadMessagePageUseCase } from '@/modules/message/application/use-cases/slide-message/get-thread-message-page.usecase';

@Module({
  imports: [
    SocialGraphPersistenceModule,
    UserPersistenceModule,
    ConversationPersistenceModule,
    RedisClusterModule,
    LoggerModule,
    MessagePersistenceModule,
  ],
  providers: [
    DirectViewerThreadUseCase,
    GetSlideMessageConnectionUseCase,
    GetThreadMessagePageUseCase,
  ],
  exports: [DirectViewerThreadUseCase, GetThreadMessagePageUseCase],
})
export class DirectViewerThreadModule {}
