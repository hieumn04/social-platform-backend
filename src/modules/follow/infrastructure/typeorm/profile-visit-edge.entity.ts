import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('profile_visit_edge')
@Index('idx_profile_visit_viewer', ['viewerId'])
export class ProfileVisitEdgeEntity {
  @PrimaryColumn({
    type: 'bigint',
    name: 'viewer_id',
  })
  viewerId!: string;

  @PrimaryColumn({
    type: 'bigint',
    name: 'target_user_id',
  })
  targetUserId!: string;

  @Column({
    type: 'int',
    default: 1,
    name: 'visit_count',
  })
  visitCount!: number;

  @Column({
    type: 'timestamp',
    name: 'last_visit_at',
  })
  lastVisitAt!: Date;
}
