import { GetSlideMailBoxForIrisSubscriptionUseCase } from '@/modules/coversation/application/use-cases/getslidemailbox/get_slide_mailbox_for_iris_subscription.usecase';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';
import { MessagePersistenceModule } from '@/modules/message/infrastructure/repositories/message-persistence.module';
import { SocialGraphPersistenceModule } from '@/modules/social-graph/infrastructure/repositories/follows-persistence.module';
import { UserPersistenceModule } from '@/modules/users/infrastructure/repositories/user-persistence.module';
import { GetSlideMessageConnectionUseCase } from '@/modules/message/application/use-cases/slide-message/get-slide-messages.usecase';
import { LoggerModule } from '@/shared/logger/logger.module';
import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConversationPersistenceModule,
    MessagePersistenceModule,
    SocialGraphPersistenceModule,
    UserPersistenceModule,
    RedisClusterModule,
    LoggerModule,
  ],
  providers: [GetSlideMailBoxForIrisSubscriptionUseCase, GetSlideMessageConnectionUseCase],
  exports: [GetSlideMailBoxForIrisSubscriptionUseCase],
})
export class GetSlideMailBoxForIrisSubscriptionModule {}
