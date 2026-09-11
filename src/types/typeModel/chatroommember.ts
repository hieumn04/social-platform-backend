import { ChatRoomMemberStatus } from '@/shared/enums/roomStatus.enum';

export interface UserRoomSummaryProps {
  userId: string;
  chatRoomId: string;
  lastMessageId?: string | null;
  lastMessageAt?: Date | null;
  lastReadMessageId?: string | null;
  lastReadMessageAt?: Date | null;
  lastSeenSeq: number;
  unreadCount: number;
  pinned: boolean;
  pinnedAt?: Date | null;
  muted: boolean;
  roomSeq: number;
  canSendMessage: boolean;
  status: ChatRoomMemberStatus;
  otherUserId?: string;
}
