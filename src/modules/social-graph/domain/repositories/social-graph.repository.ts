export const SOCIAL_GRAPH_REPOSITORY = 'ISocialGraphRepository';

export interface SocialGraphUser {
  id: string;
  username: string;
  isPrivate: boolean;
}

export interface FriendshipStatusSnapshot {
  following: boolean;
  outgoing_request: boolean;
  incoming_request: boolean;
  followed_by: boolean;
  is_bestie: boolean;
  is_private: boolean;
  is_restricted: boolean;
  is_feed_favorite: boolean;
  blocking: boolean;
  blocked_by: boolean;
}

export interface FriendshipMutationSuccess {
  kind: 'FOLLOWING' | 'REQUESTED' | 'UNFOLLOWED' | 'ACCEPTED' | 'BLOCKED';
  user: SocialGraphUser;
  friendshipStatus: FriendshipStatusSnapshot;
}

export type FollowMutationResult =
  | FriendshipMutationSuccess
  | { kind: 'TARGET_NOT_FOUND' }
  | { kind: 'FOLLOW_FORBIDDEN' }
  | { kind: 'REQUEST_NOT_FOUND' };

export interface ISocialGraphRepository {
  follow(actorId: string, targetId: string): Promise<FollowMutationResult>;
  unfollow(actorId: string, targetId: string): Promise<FollowMutationResult>;
  acceptFollowRequest(
    receiverId: string,
    senderId: string,
  ): Promise<FollowMutationResult>;
  blockUser(
    blockerId: string,
    blockedId: string,
  ): Promise<FollowMutationResult>;
  getFriendshipStatus(
    viewerId: string,
    targetId: string,
  ): Promise<FriendshipStatusSnapshot | null>;
}
