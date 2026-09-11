import { Entity, Column, Index } from 'typeorm';

@Entity('follow_score')
@Index(['viewer_id', 'final_score']) // composite index for fetching top affinity
export class FollowScoreEntity {
  @Column({ type: 'bigint', name: 'viewer_id', primary: true })
  viewer_id!: string;

  @Column({ type: 'bigint', name: 'target_user_id', primary: true })
  target_user_id!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'interaction_score',
    default: 0,
  })
  interaction_score!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'follow_score',
    default: 0,
  })
  follow_score!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'final_score',
    default: 0,
  })
  final_score!: number;

  @Column({ type: 'boolean', name: 'dirty_flag', default: false })
  dirty_flag!: boolean;

  @Column({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
