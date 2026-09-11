import { CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('follow_request_edge')
@Index('idx_follow_request_requester', ['requesterId'])
@Index('idx_follow_request_target', ['targetUserId'])
export class FollowRequestEdgeEntity {
  @PrimaryColumn({
    type: 'bigint',
    name: 'requester_id',
  })
  requesterId!: string;

  @PrimaryColumn({
    type: 'bigint',
    name: 'target_user_id',
  })
  targetUserId!: string;

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
  })
  createdAt!: Date;
}
