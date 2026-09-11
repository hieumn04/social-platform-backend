import { UserFollowAction } from '@/shared/enums/user-follow-status.enum';

export interface UserFollowActionRecordProps {
  action: UserFollowAction;
  context: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type FollowRow = {
  follower_id: string;
  following_id: string;
  status: number;
  is_restricted: boolean;
  is_bestie: boolean;
  is_feed_favorite: boolean;
};

export type IncomingFollowRow = {
  follower_id: string;
  following_id: string;
  status: number;
};

export interface FriendshipStatus {
  is_restricted: boolean;
  blocking: boolean;
}

export interface FriendshipStatusModel {
  following: boolean;
  incoming_request: boolean;
  outgoing_request: boolean;
  is_bestie: boolean;
  is_restricted: boolean;
  is_feed_favorite: boolean;
  is_private: boolean;
}

export type FollowersCursor = {
  createdAt: string;
  followerId: string;
};

export type FollowersCandidateRow = {
  follower_id: string;
  created_at: string;

  // relationship strength
  interaction_rank: number | null;
  last_interaction_at: string | null;

  // graph signals
  accepted_at: string | null;
  removed_at: string | null;

  // negative signals
  muted_story: boolean;
  muted_post: boolean;
  is_restricted: boolean;

  // personalization flags
  is_bestie: boolean;
  is_feed_favorite: boolean;
};

export interface FollowerCandidate {
  followerId: string;

  // Relationship strength
  interactionRank?: number;
  lastInteractionAt?: Date | null;
  isBestie?: boolean;
  isFeedFavorite?: boolean;

  // Follow graph
  mutual?: boolean;
  createdAt?: Date;
  acceptedAt?: Date;

  // Negative signals
  isRestricted?: boolean;
  mutedStory?: boolean;
  mutedPost?: boolean;
  removedAt?: Date | null;

  // Viewer affinity
  dmScore?: number; // 0 → 1
  storyViewScore?: number;
  profileViewScore?: number;
  likeScore?: number;
}

export interface RankedFollower extends FollowerCandidate {
  score: number;
}

export interface FollowScorePair {
  followerId: string;
  followingId: string;
}
