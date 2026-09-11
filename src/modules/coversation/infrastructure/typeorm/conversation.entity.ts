import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { ConversationSubtype } from '@/shared/enums/roomStatus.enum';
import { UserEntity } from '@/modules/users/infrastructure/typeorm/user.entity';
import { MessageEntity } from '@/modules/message/infrastructure/typeorm/message.entity';
import { ConversationParticipantEntity } from '@/modules/coversation/infrastructure/typeorm/conversation-participant.entity';

@Entity('conversations')
export class ConversationEntity {
  /* ==============================
   * Identity
   * ============================== */
  @PrimaryColumn({ name: 'conversation_id', type: 'bigint' })
  id!: string;

  /* ==============================
   * Type
   * ============================== */
  @Column({
    type: 'enum',
    enum: ConversationSubtype,
  })
  subtype!: ConversationSubtype;

  /* ==============================
   * Creator
   * ============================== */
  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy?: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by' })
  creator?: UserEntity;

  /* ==============================
   * Display (group / system only)
   * ============================== */
  @Column({ length: 255, nullable: true })
  title?: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string;

  /* ==============================
   * Lifecycle
   * ============================== */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /* ==============================
   * Relations
   * ============================== */

  /** All participants */
  @OneToMany(() => ConversationParticipantEntity, (p) => p.conversation)
  participants!: ConversationParticipantEntity[];

  @OneToMany(() => MessageEntity, (m) => m)
  messages!: MessageEntity[];

  /**
   * (Optional – highly recommended)
   * Last message snapshot for inbox hydrate
   */
  @Column({ name: 'last_message_id', type: 'bigint', nullable: true })
  lastMessageId?: string;

  @ManyToOne(() => MessageEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'last_message_id' })
  lastMessage?: MessageEntity;
}
