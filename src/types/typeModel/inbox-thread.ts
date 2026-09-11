import {
  InboxFolder,
  ReachabilityStatus,
  SystemFolder,
} from '@/shared/enums/roomStatus.enum';

export interface InboxThreadProps {
  threadId: string;
  userId: string;
  conversationId?: string;
  threadKey: string;
  folder: InboxFolder;
  systemFolder: SystemFolder;
  reachabilityStatus: ReachabilityStatus;
  lastMessageId?: string | null;
  lastMessageAt?: Date | null;
  lastMessageSnippet?: string | null;
  lastMessageSenderId?: string | null;

  lastReadAt?: Date | null;
  unreadCount: number;
  markedAsUnread: boolean;

  pinned: boolean;
  muted: boolean;
  archived: boolean;
  displayName?: string | null;
  displayAvatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ResolveThreadResult = {
  threadFbid: string | null;
  exists: boolean;
  conversationId?: string;
  threadKey: string;
};

export interface ResolveThreadWithViewerResult extends ResolveThreadResult {
  viewerId: string;
}
