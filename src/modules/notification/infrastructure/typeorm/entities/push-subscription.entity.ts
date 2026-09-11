import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('push_subscriptions')
@Index('idx_push_subscriptions_user_active', ['userId', 'revokedAt'])
@Index('uq_push_subscriptions_endpoint', ['endpoint'], { unique: true })
export class PushSubscriptionEntity {
  @PrimaryColumn({ name: 'id', type: 'bigint' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Column({ name: 'endpoint', type: 'varchar', length: 500 })
  endpoint!: string;

  @Column({ name: 'p256dh', type: 'varchar', length: 255 })
  p256dh!: string;

  @Column({ name: 'auth', type: 'varchar', length: 255 })
  auth!: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}