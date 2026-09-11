import { ShowManyFriendshipsInput } from '@/modules/follow/application/usecase/show-many-friendships/show-many-friendships.input';
import { ShowManyFriendshipsOutput } from '@/modules/follow/application/usecase/show-many-friendships/show-many-friendships.output';
import { FriendshipStatusDomainService } from '@/modules/follow/domain/domain-service/friendship-status-builder.domain-service';
import { FollowsReadRepository } from '@/modules/follow/domain/repositories/follows.repository.interface';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ShowManyFriendshipsUseCase {
  constructor(
    @Inject('FollowsReadRepository')
    private readonly followsRepo: FollowsReadRepository,
    private readonly friendshipDomain: FriendshipStatusDomainService,
  ) {}

  async execute(
    input: ShowManyFriendshipsInput,
  ): Promise<ShowManyFriendshipsOutput> {
    const { viewerId, userIds } = input;

    if (!userIds.length) {
      return { friendship_statuses: {} };
    }

    const [outgoingMap, incomingMap] = await Promise.all([
      this.followsRepo.findOutgoingRelationships(viewerId, userIds),
      this.followsRepo.findIncomingRelationships(viewerId, userIds),
    ]);

    const friendshipStatuses = this.friendshipDomain.buildFriendshipStatuses(
      userIds,
      outgoingMap,
      incomingMap,
    );

    return {
      ordered_user_ids: userIds,
      friendship_statuses: friendshipStatuses,
    };
  }
}
