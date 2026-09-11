import { UserEntity } from 'src/modules/users/infrastructure/typeorm/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostsMediaEntity } from './post-media.entity';

@Entity('Posts')
@Index('IDX_POSTS_USER_CREATED', ['userId', 'createdAt'])
@Index('IDX_POSTS_CREATED_DESC', ['createdAt'])
export class PostEntity {
  @PrimaryColumn({ name: 'Id', length: 36 })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Column({ name: 'Caption', type: 'text', nullable: true })
  caption?: string;

  @Column({ name: 'LikesCount', type: 'bigint', default: 0 })
  likesCount!: number;

  @Column({ name: 'CommentsCount', type: 'bigint', default: 0 })
  commentsCount!: number;

  @Column({ name: 'IsDeleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UpdatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @OneToMany(() => PostsMediaEntity, (media) => media.post, { cascade: true })
  media!: PostsMediaEntity[];
}
