import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_mute_edge')
@Index('idx_mute_user', ['userId'])
export class MuteEdgeEntity {
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

  @Column({
    type: 'boolean',
    default: false,
    name: 'mute_story',
  })
  muteStory!: boolean;

  @Column({
    type: 'boolean',
    default: false,
    name: 'mute_post',
  })
  mutePost!: boolean;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
