import { Entity, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('block_edge')
@Index('idx_block_user', ['userId'])
@Index('idx_block_target', ['blockedUserId'])
export class BlockEdgeEntity {
  @PrimaryColumn({
    type: 'bigint',
    name: 'user_id',
  })
  userId!: string;

  @PrimaryColumn({
    type: 'bigint',
    name: 'blocked_user_id',
  })
  blockedUserId!: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
