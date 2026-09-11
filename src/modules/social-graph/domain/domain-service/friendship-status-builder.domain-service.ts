import { Injectable } from '@nestjs/common';
import { UserFollowStatus } from '@/shared/enums/user-follow-status.enum';
import {
  FollowRow,
  IncomingFollowRow,
  FriendshipStatusModel,
} from '@/types/typeModel/follows';

@Injectable()
export class FriendshipStatusDomainService {
  buildFriendshipStatuses(
    targetUserIds: string[],
    outgoing: Map<string, FollowRow>,
    incoming: Map<string, IncomingFollowRow>,
  ): Record<string, FriendshipStatusModel> {
    const result: Record<string, FriendshipStatusModel> = {};

    for (const userId of targetUserIds) {
      const out = outgoing.get(userId);
      const inc = incoming.get(userId);

      const viewerStatus = out?.status;
      const targetStatus = inc?.status;

      result[userId] = {
        following: viewerStatus === UserFollowStatus.ACCEPTED,
        outgoing_request: viewerStatus === UserFollowStatus.PENDING,
        incoming_request: targetStatus === UserFollowStatus.PENDING,
        is_bestie: out?.is_bestie ?? false,
        is_restricted: out?.is_restricted ?? false,
        is_feed_favorite: out?.is_feed_favorite ?? false,

        is_private: false,
      };
    }

    return result;
  }
}
