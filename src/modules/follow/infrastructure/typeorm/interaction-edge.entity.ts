import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('user_interaction_edge')
@Index('idx_interaction_score', ['interactionScore'])
@Index('idx_interaction_last', ['lastInteractionAt'])
export class InteractionEdgeEntity {
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
    default: 0,
    name: 'interaction_score',
  })
  interactionScore!: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_interaction_at',
  })
  lastInteractionAt!: Date | null;
}
