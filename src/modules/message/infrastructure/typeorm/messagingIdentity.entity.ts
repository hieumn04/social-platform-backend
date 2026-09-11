import { UserEntity } from '@/modules/users/infrastructure/typeorm/user.entity';
import { MessagingPlatform } from '@/shared/enums/message.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('messaging_actors')
@Index('IDX_MSG_ACTOR_USER_PLATFORM', ['userId', 'platform'], { unique: true })
@Index('IDX_MSG_ACTOR_INTEROP_FBID', ['id'], { unique: true })
export class MessagingActorEntity {
  @PrimaryColumn({ name: 'interop_messaging_user_fbid', type: 'bigint' })
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.messagingActors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({
    name: 'platform',
    type: 'enum',
    enum: MessagingPlatform,
  })
  platform!: MessagingPlatform;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
