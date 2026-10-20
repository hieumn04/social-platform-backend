import { UserEntity } from '@/modules/users/infrastructure/typeorm/user.entity';
import {
  ConversationSubtype,
  InboxFolder,
  ReachabilityStatus,
  SystemFolder,
} from '@/shared/enums/roomStatus.enum';
import {
  Entity,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * System-level folder (Instagram internal)
 * Used for routing / feature flags
 */

@Entity('inbox_threads')
@Index('idx_inbox_thread_query', [
  'viewerId',
  'systemFolder',
  'folder',
  'pinned',
  'pinnedAt',
  'lastActivityAt',
])
@Index('idx_viewer_folder', ['viewerId', 'folder'])
@Index('idx_viewer_pinned', ['viewerId', 'pinned', 'pinnedAt'])
@Index('idx_inbox_direct_counterparty', [
  'viewerId',
  'counterpartyUserId',
  'lastActivityAt',
])
@Index('uniq_viewer_thread', ['viewerId', 'threadFbid'], { unique: true })
export class InboxThreadEntity {
  @PrimaryColumn({ name: 'id', type: 'bigint' })
  id!: string;

  @Column({ name: 'viewer_id', type: 'bigint' })
  viewerId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'viewer_id' })
  viewer!: UserEntity;

  @Column({ name: 'counterparty_user_id', type: 'bigint', nullable: true })
  counterpartyUserId?: string | null;

  @Column({ name: 'thread_fbid', type: 'bigint' })
  threadFbid!: string;

  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @Column({ name: 'thread_key', type: 'bigint' })
  threadKey!: string;

  @Column({
    name: 'thread_subtype',
    type: 'enum',
    enum: ConversationSubtype,
  })
  threadSubtype!: ConversationSubtype;

  @Column({
    name: 'folder',
    type: 'enum',
    enum: InboxFolder,
    default: InboxFolder.PRIMARY,
  })
  folder!: InboxFolder;

  @Column({
    name: 'system_folder',
    type: 'enum',
    enum: SystemFolder,
    default: SystemFolder.INBOX,
  })
  systemFolder!: SystemFolder;

  @Column({
    name: 'reachability_status',
    type: 'enum',
    enum: ReachabilityStatus,
    default: ReachabilityStatus.REACHABLE,
  })
  reachabilityStatus!: ReachabilityStatus;

  @Column({ name: 'last_message_id', type: 'bigint', nullable: true })
  lastMessageId?: string;

  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt?: Date;

  @Column({ name: 'marked_as_unread', default: false })
  markedAsUnread!: boolean;

  @Column({ default: false })
  pinned!: boolean;

  @Column({
    name: 'pinned_at',
    type: 'timestamp',
    nullable: true,
  })
  pinnedAt?: Date;

  @Column({ default: false })
  muted!: boolean;

  @Column({ default: false })
  archived!: boolean;

  @Column({ name: 'display_name', length: 255, nullable: true })
  displayName?: string;

  @Column({ name: 'display_avatar_url', type: 'text', nullable: true })
  displayAvatarUrl?: string;

  @Column({
    name: 'ig_end_cursor',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  igEndCursor?: string;

  @Column({
    name: 'ig_has_next_page',
    type: 'boolean',
    default: true,
  })
  igHasNextPage!: boolean;

  @Column({
    name: 'last_synced_at',
    type: 'timestamp',
    nullable: true,
  })
  lastSyncedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
