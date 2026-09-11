import { MessageType } from '@/shared/enums/message.enum';
import { StreamMessage } from '@/shared/redis-cluster/redis-stream.service';

export interface BaseEvent<
  TType extends string,
  TData,
  TVersion extends number = 1,
> {
  eventId: string;
  originalEventId?: string;
  type: TType;
  version: TVersion;
  timestamp: number;
  data: TData;
  retryCount?: number;
}

export type MessageCreatedEventV1 = BaseEvent<
  'message.created',
  {
    messageId: string;
    conversationId: string;
    senderId: string;
    recipientId?: string;
    content?: string;
    clientContext: string;
    sendAttribution?: string;
    messageType?: MessageType;
    payload?: Record<string, any>;
  },
  1
>;

export type ConversationReadWatermarkUpdatedEventV1 = BaseEvent<
  'conversation.read_watermark_updated',
  {
    threadFbid: string;
    conversationId: string;
    participantId: string;
    messageId: string;
    readTimestampMs: string;
  },
  1
>;

export type AppEvent =
  | MessageCreatedEventV1
  | ConversationReadWatermarkUpdatedEventV1;

export const EventRegistry = {
  'message.created': [1],
  'conversation.read_watermark_updated': [1],
} as const;

/**
 * Event handler type — receives both the typed event and the raw StreamMessage.
 * raw.id is the Redis Stream ID used as `seq` in mailbox_events.
 */
export type EventHandler<T extends AppEvent> = (
  event: T,
  raw: StreamMessage,
) => Promise<void>;

export type ExtractEventData<T extends AppEvent> = T['data'];
