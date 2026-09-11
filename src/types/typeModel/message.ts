import { MessageType, MessagingPlatform } from '@/shared/enums/message.enum';

export interface MessageProps {
  conversationId: string;

  clientMessageId: string;

  senderId?: string;

  type: MessageType;
  content?: string;

  payload?: Record<string, any>;

  replyToMessageId?: string;

  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface MessagingIdentityProps {
  userId: string;
  platform: MessagingPlatform;
  createdAt: Date;
}

export interface SlideMessageTextInput {
  sensitive_string_value: string;
}

export interface SendSlideMessageInput {
  ig_thread_igid?: string;
  offline_threading_id: string;

  recipient_igids: string[] | null;

  text?: SlideMessageTextInput | null;
  content_type?: MessageType | null;
  attachments?: Array<{
    upload_id: string;
    width?: number | null;
    height?: number | null;
  }> | null;
  inline_share?: {
    target_type: 'POST' | 'CAROUSEL' | 'REEL';
    target_id: string;
    selected_media_id?: string | null;
  } | null;

  replied_to_client_context?: string | null;
  replied_to_item_id?: string | null;
  reply_to_message_id?: string | null;

  sampled?: boolean | null;

  mentions?: string[];
  mentioned_user_ids?: string[];

  commands?: string | null;

  forwarded_from_thread_id?: string | null;
  is_forwarded_from_own_message?: boolean | null;
}

export type SendSlideMessageWithAttribution = SendSlideMessageInput & {
  send_attribution?: string;
};

export interface ThreadMessageCursor {
  threadId: string;
  threadFbid?: string;
  lastMessageId: string;
}

export interface BaseSendMessageInput {
  clientMessageId: string;
  text?: string;
  replyToMessageId?: string;
  contentType: MessageType;
  payload?: Record<string, any>;
  snippet?: string;
}
