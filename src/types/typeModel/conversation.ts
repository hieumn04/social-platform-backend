import { ConversationSubtype } from '@/shared/enums/roomStatus.enum';

export interface ConversationProps {
  conversationId: string;
  subtype: ConversationSubtype;
  createdBy?: string | null;
  title?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  lastMessageId?: string | null;
}
