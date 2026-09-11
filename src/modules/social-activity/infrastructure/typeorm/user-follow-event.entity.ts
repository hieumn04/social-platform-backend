import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';


@Entity({ name: 'user_follow_event' })
@Index('idx_follow_event_actor_time', ['actorId', 'createdAt'])
@Index('idx_follow_event_target_time', ['targetId', 'createdAt'])
@Index('idx_follow_event_action_time', ['action', 'createdAt'])
export class UserFollowEventEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id!: string;

  @Column({
    name: 'actor_id',
    type: 'bigint',
    unsigned: true,
  })
  actorId!: string;

  @Column({
    name: 'target_id',
    type: 'bigint',
    unsigned: true,
  })
  targetId!: string;

  @Column({ type: 'smallint', unsigned: true })
  action!: number;

  @Column({ type: 'smallint', unsigned: true })
  context!: number;

  @Column({
    type: 'json',
    nullable: true,
  })
  metadata?: Record<string, any>;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    precision: 3, // ms
  })
  createdAt!: Date;
}
