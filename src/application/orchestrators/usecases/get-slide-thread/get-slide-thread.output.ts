import {
  MessagingFolderTag,
  ReachabilityStatus,
} from '@/shared/enums/roomStatus.enum';

export interface GetSlideThreadOutput {
  id: string;
  asIgDirectThread: IGDirectViewerThreadOutput;
}

export interface IGDirectViewerThreadOutput {
  id: string;
  viewerId: string;

  isGroup: boolean;
  threadSubtype: string;

  users: IGThreadUserOutput[];

  threadKey?: string | null;

  viewer?: IGViewerOutput | null;

  threadImageUrl?: string | null;
  threadTitle?: string | null;

  nicknames: string[];

  threadFbid?: string | null;
  threadIgid?: string | null;

  reachabilityStatus?: ReachabilityStatus | null;
  messagingFolderTag?: MessagingFolderTag | null;

  instamadilloCutover?: string | null;
}

/**
 * User trong thread
 */
export interface IGThreadUserOutput {
  id: string;
  username: string;
  profilePicUrl?: string | null;

  interopMessagingUserFbid?: string | null;
  fullName?: string | null;

  isVerified?: boolean | null;

  aiAgentType?: string | null;
  aiAgentOwnerUsername?: string | null;

  friendshipStatus?: FriendshipStatusOutput | null;
}

/**
 * Viewer
 */
export interface IGViewerOutput {
  id: string;
  interopMessagingUserFbid?: string | null;
  profilePicUrl?: string | null;
}

/**
 * Friendship status
 */
export interface FriendshipStatusOutput {
  isRestricted: boolean;
  blocking: boolean;
}
