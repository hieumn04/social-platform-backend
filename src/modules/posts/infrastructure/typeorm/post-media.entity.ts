import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { PostEntity } from './posts.entity';
import { PostMediaType } from 'src/shared/enums/post-media.enum';

@Entity('PostsMedia')
@Index('IDX_POST_MEDIA_POST_POSITION', ['postId', 'position'])
export class PostsMediaEntity {
  @PrimaryColumn({ name: 'Id', length: 36 })
  id!: string;

  @Column({ name: 'PostId', length: 36 })
  postId!: string;

  @Column({ name: 'Type', type: 'enum', enum: PostMediaType, nullable: true })
  type!: PostMediaType;

  @Column({ name: 'Url', type: 'text' })
  url!: string;

  @Column({ name: 'Position', type: 'int', default: 0 })
  position!: number;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt!: Date;

  @ManyToOne(() => PostEntity, (post) => post.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'PostId' })
  post!: PostEntity;
}
