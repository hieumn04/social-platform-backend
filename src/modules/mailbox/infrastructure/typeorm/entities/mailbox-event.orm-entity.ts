import { MailboxEventType } from '@/shared/enums/message.enum';
import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('mailbox_events')
@Index('idx_user_seq', ['userId', 'seq'])
@Index('idx_user_thread', ['userId', 'threadId'])
@Index('idx_user_created', ['userId', 'createdAt'])
export class MailboxEventOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @PrimaryColumn({ name: 'seq', type: 'varchar', length: 50 })
  seq!: string;

  /* ==============================
   * Core
   * ============================== */

  @Column({ name: 'thread_id', type: 'bigint' })
  threadId!: string;

  @Column({ name: 'event_type', type: 'smallint' })
  eventType!: MailboxEventType;

  @Column({ name: 'message_id', type: 'bigint', nullable: true })
  messageId!: string | null;

  @Column({ name: 'actor_id', type: 'bigint', nullable: true })
  actorId!: string | null;

  /* ==============================
   * Timestamp
   * ============================== */

  @Column({ name: 'created_at', type: 'bigint' })
  createdAt!: number;
}
