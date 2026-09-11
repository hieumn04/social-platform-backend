import { GetSlideThreadNullableUseCase } from '@/modules/coversation/application/use-cases/get-slide-thread-nullable/get-slide-thread-nullable.usecase';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';

import { SocialGraphPersistenceModule } from '@/modules/social-graph/infrastructure/repositories/follows-persistence.module';
import { UserPersistenceModule } from '@/modules/users/infrastructure/repositories/user-persistence.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    SocialGraphPersistenceModule,
    UserPersistenceModule,
    ConversationPersistenceModule,
    LoggerModule,
  ],
  providers: [GetSlideThreadNullableUseCase],
  exports: [GetSlideThreadNullableUseCase],
})
export class GetSlideThreadNullableModule {}
