import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MessageMediaUploadStatus {
  PENDING = 'PENDING',
  ATTACHED = 'ATTACHED',
  EXPIRED = 'EXPIRED',
}

@Entity('message_media_uploads')
@Index('idx_message_upload_owner_status', ['ownerId', 'status', 'expiresAt'])
export class MessageMediaUploadEntity {
  @PrimaryColumn({ name: 'upload_id', type: 'char', length: 36 })
  id!: string;

  @Column({ name: 'owner_id', type: 'bigint' })
  ownerId!: string;

  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId!: string;

  @Column({ name: 'object_key', type: 'varchar', length: 512, unique: true })
  objectKey!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 128 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Column({ type: 'int', nullable: true })
  width?: number;

  @Column({ type: 'int', nullable: true })
  height?: number;

  @Column({
    type: 'enum',
    enum: MessageMediaUploadStatus,
    default: MessageMediaUploadStatus.PENDING,
  })
  status!: MessageMediaUploadStatus;

  @Column({ name: 'attached_message_id', type: 'bigint', nullable: true })
  attachedMessageId?: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ name: 'cleanup_claimed_at', type: 'datetime', nullable: true })
  cleanupClaimedAt?: Date;

  @Column({ name: 'cleanup_attempts', type: 'int', default: 0 })
  cleanupAttempts!: number;

  @Column({
    name: 'cleanup_error',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  cleanupError?: string;

  @Column({ name: 'cleaned_at', type: 'datetime', nullable: true })
  cleanedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
