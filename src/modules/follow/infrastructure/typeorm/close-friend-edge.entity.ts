import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('close_friend_edge')
@Index('idx_close_friend_user', ['userId'])
export class CloseFriendEdgeEntity {
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

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}