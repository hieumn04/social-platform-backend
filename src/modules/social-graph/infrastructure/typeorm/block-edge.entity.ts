import { Entity, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('block_edge')
@Index('idx_block_blocker', ['blockerId'])
@Index('idx_block_blocked', ['blockedId'])
export class BlockEdgeEntity {
  @PrimaryColumn({
    type: 'bigint',
    name: 'blocker_id',
  })
  blockerId!: string;

  @PrimaryColumn({
    type: 'bigint',
    name: 'blocked_id',
  })
  blockedId!: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
