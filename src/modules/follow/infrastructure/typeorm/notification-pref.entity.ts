import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_notification_pref')
@Index('idx_notification_pref_user', ['userId'])
export class NotificationPrefEntity {
  @PrimaryColumn({
    type: 'bigint',
    name: 'user_id',
  })
  userId!: string;

  @PrimaryColumn({
    type: 'bigint',
    name: 'target_user_id',
  })
  targetUserId!: string;

  @Column({ type: 'boolean', default: false })
  story!: boolean;

  @Column({ type: 'boolean', default: false })
  post!: boolean;

  @Column({ type: 'boolean', default: false })
  live!: boolean;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;
}
