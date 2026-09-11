import {
  ConversationRole,
  ParticipantStatus,
} from '@/shared/enums/roomStatus.enum';

export interface ConversationParticipantProps {
  conversationId: string;
  userId: string;
  role: ConversationRole;
  status: ParticipantStatus;
  lastReadAt?: Date | null;
  manuallyMarkedUnread: boolean;
  isHidden: boolean;
  lastActivityAt?: Date | null;
  muted: boolean;
  archived: boolean;
  pinned: boolean;
  nickname?: string | null;
  joinedAt: Date;
  leftAt?: Date | null;
  updatedAt: Date;
}

export interface ConversationParticipantRaw {
  conversation_id: string;
  user_id: string;
}

export interface ConversationParticipantSqlRow {
  conversation_id: string;
  user_id: string;
}
