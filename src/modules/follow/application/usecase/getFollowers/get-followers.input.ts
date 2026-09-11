import { FollowersCursor } from '@/types/typeModel/follows';

export interface GetFollowersInput {
  viewerId: string;
  targetUserId: string;
  limit?: number;
  cursor?: FollowersCursor;
}
