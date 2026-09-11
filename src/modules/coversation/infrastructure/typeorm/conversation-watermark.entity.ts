import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Tracks per-participant delivery and read state for a conversation.
 *
 * One row per (conversation, participant) pair — regardless of message count.
 *
 * Delivery state check:
 *   isDelivered = message.timestampMs <= deliveryWatermarkTimestampMs
 *
 * Read state check:
 *   isRead = message.timestampMs <= readWatermarkTimestampMs
 *
 * Scale comparison vs message_delivery table:
 *   group(100 users) x 10,000 messages:
 *   - message_delivery: 1,000,000 rows
 *   - conversation_watermarks: 100 rows
 */
@Entity('conversation_watermarks')
@Index(['conversationId'])
export class ConversationWatermarkEntity {
  @PrimaryColumn({ name: 'conversation_id', type: 'bigint' })
  conversationId!: string;

  @PrimaryColumn({ name: 'participant_id', type: 'bigint' })
  participantId!: string;


  @Column({
    name: 'delivery_watermark_timestamp_ms',
    type: 'bigint',
    default: '0',
  })
  deliveryWatermarkTimestampMs!: string;


  @Column({
    name: 'read_watermark_timestamp_ms',
    type: 'bigint',
    default: '0',
  })
  readWatermarkTimestampMs!: string;



  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
