import { Entity, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('user_restrict_edge')
@Index('idx_restrict_user', ['userId'])
export class RestrictEdgeEntity {
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
