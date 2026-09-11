import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { UserEntity } from '@/modules/users/infrastructure/typeorm/user.entity';
import { MessageEntity } from '@/modules/message/infrastructure/typeorm/message.entity';

@Entity('message_reactions')
@Index(['messageId'])
@Index(['messageId', 'userId'], { unique: true })
export class MessageReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'message_id',
    type: 'bigint',
  })
  messageId!: string;

  @ManyToOne(() => MessageEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message!: MessageEntity;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({
    name: 'reaction',
    type: 'varchar',
    length: 16,
  })
  reaction!: string;
}
