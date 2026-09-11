import { FriendshipStatusDomainService } from '@/modules/follow/domain/domain-service/friendship-status-builder.domain-service';
import { Module } from '@nestjs/common';

@Module({
  providers: [FriendshipStatusDomainService],
  exports: [FriendshipStatusDomainService],
})
export class FriendshipStatusDomainModule {}
