import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('user_follow_event')
@Index(['actor_id', 'created_at'])
@Index(['target_user_id', 'created_at'])
export class UserFollowEventEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'actor_id' })
  actor_id: string;

  @Column({ type: 'bigint', name: 'target_user_id' })
  target_user_id: string;

  @Column({ type: 'varchar', length: 50, name: 'event_type' })
  event_type: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
