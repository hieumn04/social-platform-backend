// src/modules/posts/infrastructure/mysql/post.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { PostEntity } from '../typeorm/posts.entity';
import { PostRepository } from '../../domain/repositories/posts.repository.interface';

import { AppLogger } from 'src/shared/logger/applogger';
import { Post } from '../../domain/models/posts.model';

@Injectable()
export class PostEntityRepositoryImpl implements PostRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly ormRepo: Repository<PostEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('PostEntityRepositoryImpl');
  }

  async findById(id: string): Promise<Post | null> {
    const row = await this.ormRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['media'],
      order: { media: { position: 'ASC' } },
    });

    if (!row) return null;

    this.logger.log(`findById: ${id} `);

    return this.toDomain(row);
  }

  async findByUserId(userId: string): Promise<Post[]> {
    const rows = await this.ormRepo.find({
      where: { userId, isDeleted: false },
      relations: ['media'],
      order: { createdAt: 'DESC', media: { position: 'ASC' } },
    });

    this.logger.log(`findByUserId: ${userId} → ${rows.length} posts`);

    return rows.map((r) => this.toDomain(r));
  }

  async save(post: Post): Promise<void> {
    const obj = post.toObject();

    const entity = this.ormRepo.create({
      id: obj.id,
      userId: obj.userId,
      caption: obj.caption,
      likesCount: obj.likesCount,
      commentsCount: obj.commentsCount,
      isDeleted: obj.isDeleted,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    });

    await this.ormRepo.save(entity);
    this.logger.log(`save post: ${obj.id} 💾`);
  }

  async delete(postId: string): Promise<void> {
    await this.ormRepo.delete({ id: postId });
    this.logger.warn(`delete post: ${postId} 🗑`);
  }

  async softDelete(postId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(PostEntity) : this.ormRepo;
    await repo.update({ id: postId }, { isDeleted: true });
    this.logger.warn(`softDelete post: ${postId}`);
  }

  /**
   * Chuyển từ PostEntity (infrastructure) sang Post domain Entity
   */
  private toDomain(row: PostEntity): Post {
    return new Post(
      {
        userId: row.userId,
        caption: row.caption,
        likesCount: Number(row.likesCount),
        commentsCount: Number(row.commentsCount),
        isDeleted: row.isDeleted,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  /**
   * Mapping cả media cho domain (nếu domain cần dùng)
   */
  private mapMedia(row: PostEntity) {
    if (!row.media?.length) return [];

    return row.media.map((m) => ({
      id: m.id,
      postId: m.postId,
      type: m.type,
      url: m.url,
      position: m.position,
      createdAt: m.createdAt,
    }));
  }

  // private toDomainWithMedia(row: PostEntity): Post & { media: any[] } {
  //   const post = this.toDomain(row);
  //   (post as any).media = this.mapMedia(row);
  //   return post;
  // }
}
