export enum MessageType {
  TEXT = 'TEXT',
  IMAGES = 'IMAGES',
  MESSAGE_INLINE_SHARE = 'MESSAGE_INLINE_SHARE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  MONTAGE_SHARE_XMA = 'MONTAGE_SHARE_XMA',
  STORY_SHARE = 'STORY_SHARE',
  REEL_SHARE = 'REEL_SHARE',
  LINK = 'LINK',
}

export enum MessagingPlatform {
  IG = 'IG',
}

/**
 * Global lifecycle status of a message.
 *
 * NOTE: DELIVERED state is intentionally removed.
 * Delivery tracking is done via deliveryWatermarkTimestampMs in conversation_watermarks.
 * To check if a message was delivered to a participant:
 *   const isDelivered = message.timestampMs <= deliveryWatermarkTimestampMs;
 */
export enum MessageStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum MailboxEventType {
  MESSAGE_CREATED = 1,
  MESSAGE_DELIVERED = 2,
  MESSAGE_READ = 3,
  THREAD_UPDATED = 4,
}
