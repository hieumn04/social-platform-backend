// src/types/typeModel/userFollowProps.ts

import { UserFollowStatus } from '@/shared/enums/user-follow-status.enum';

export interface UserFollowProps {
  status: UserFollowStatus;

  isBestie: boolean;
  isFeedFavorite: boolean;
  isRestricted: boolean;

  notifyStory: boolean;
  notifyPost: boolean;
  notifyLive: boolean;

  mutedStory: boolean;
  mutedPost: boolean;

  interactionRank: number;
  lastInteractionAt: Date | null;

  createdAt: Date;
  acceptedAt: Date | null;
  removedAt: Date | null;
}
