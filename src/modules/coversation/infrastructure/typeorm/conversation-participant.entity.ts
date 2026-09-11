import { ConversationEntity } from '@/modules/coversation/infrastructure/typeorm/conversation.entity';
import { UserEntity } from '@/modules/users/infrastructure/typeorm/user.entity';

import {
  ConversationRole,
  ParticipantStatus,
} from '@/shared/enums/roomStatus.enum';

import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

@Entity('conversation_participants')
@Index(['conversationId'])
@Index(['userId'])
@Index(['conversationId', 'status'])
export class ConversationParticipantEntity {
  /* ==============================
   * Composite Primary Key
   * ============================== */

  @PrimaryColumn({
    name: 'conversation_id',
    type: 'bigint',
  })
  conversationId!: string;

  @PrimaryColumn({
    name: 'user_id',
    type: 'bigint',
  })
  userId!: string;

  /* ==============================
   * Membership / Permission
   * ============================== */

  @Column({
    type: 'enum',
    enum: ConversationRole,
    default: ConversationRole.MEMBER,
  })
  role!: ConversationRole;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.ACTIVE,
  })
  status!: ParticipantStatus;

  /* ==============================
   * Personalization
   * ============================== */

  @Column({
    length: 255,
    nullable: true,
  })
  nickname?: string;

  /* ==============================
   * Lifecycle
   * ============================== */

  @CreateDateColumn({
    name: 'joined_at',
  })
  joinedAt!: Date;

  @Column({
    name: 'left_at',
    type: 'timestamp',
    nullable: true,
  })
  leftAt?: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;

  /* ==============================
   * Relations
   * ============================== */

  @ManyToOne(() => ConversationEntity, (c) => c.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ConversationEntity;

  @ManyToOne(() => UserEntity, (u) => u.conversationParticipants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;
}
