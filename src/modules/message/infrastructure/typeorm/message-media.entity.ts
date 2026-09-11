import { MessageEntity } from '@/modules/message/infrastructure/typeorm/message.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('message_media')
@Index(['messageId'])
export class MessageMediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'message_id',
    type: 'bigint',
  })
  messageId!: string;

  @ManyToOne(() => MessageEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message!: MessageEntity;

  @Column({
    name: 'media_type',
    type: 'varchar',
    length: 32,
  })
  mediaType!: string;

  @Column({
    name: 'media_url',
    type: 'text',
  })
  mediaUrl!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 512, nullable: true })
  storageKey?: string;

  @Column({
    name: 'thumbnail_url',
    type: 'text',
    nullable: true,
  })
  thumbnailUrl?: string;

  @Column({
    name: 'preview_storage_key',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  previewStorageKey?: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 128, nullable: true })
  mimeType?: string;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes?: string;

  @Column({ type: 'int', nullable: true })
  width?: number;

  @Column({ type: 'int', nullable: true })
  height?: number;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs?: number;

  @Column({ type: 'int', default: 0 })
  position!: number;
}
