import {
  FollowersCandidateRow,
  FollowersCursor,
  FollowRow,
  FriendshipStatusModel,
  IncomingFollowRow,
} from '@/types/typeModel/follows';

export interface FollowsReadRepository {
  findFollowersCandidates(
    targetUserId: string,
    limit?: number,
    cursor?: FollowersCursor,
  ): Promise<{
    rows: FollowersCandidateRow[];
    nextCursor: FollowersCursor | null;
  }>;

  findMutualFollows(
    viewerId: string,
    candidateFollowerIds: string[],
  ): Promise<Set<string>>;

  findOutgoingRelationships(
    viewerId: string,
    targetUserIds: string[],
  ): Promise<Map<string, FollowRow>>;

  findIncomingRelationships(
    viewerId: string,
    targetUserIds: string[],
  ): Promise<Map<string, IncomingFollowRow>>;
}
