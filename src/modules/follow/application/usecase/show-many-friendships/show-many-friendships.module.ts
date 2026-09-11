import { ShowManyFriendshipsUseCase } from '@/modules/follow/application/usecase/show-many-friendships/show-many-friendships.usecase';
import { FriendshipStatusDomainModule } from '@/modules/follow/domain/domain-service/friendship-status-builder.module';

import { FollowPersistenceModule } from '@/modules/follow/infrastructure/repositories/follows-persistence.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [FollowPersistenceModule, FriendshipStatusDomainModule],
  providers: [ShowManyFriendshipsUseCase],
  exports: [ShowManyFriendshipsUseCase],
})
export class ShowManyFriendshipsModule {}
