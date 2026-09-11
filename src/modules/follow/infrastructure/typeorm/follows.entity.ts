import { Entity, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('follow_edge')
@Index('idx_follow_follower', ['followerId'])
@Index('idx_follow_following', ['followingId'])
export class FollowEdgeEntity {
  @PrimaryColumn({
    type: 'bigint',
    name: 'follower_id',
  })
  followerId!: string;

  @PrimaryColumn({
    type: 'bigint',
    name: 'following_id',
  })
  followingId!: string;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt!: Date;
}
