import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PostMediaRepository } from '../../domain/repositories/post-media.repository.interface';

import { AppLogger } from 'src/shared/logger/applogger';

import { PostsMediaEntity } from '../typeorm/post-media.entity';
import { PostMedia } from '../../domain/models/postmedia.model';
import { PostMediaType } from 'src/shared/enums/post-media.enum';

@Injectable()
export class PostMediaEntityRepositoryImpl implements PostMediaRepository {
  constructor(
    @InjectRepository(PostsMediaEntity)
    private readonly ormRepo: Repository<PostsMediaEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('PostMediaEntityRepositoryImpl');
  }

  async findById(id: string): Promise<PostMedia | null> {
    const row = await this.ormRepo.findOne({ where: { id } });
    if (!row) return null;

    this.logger.log(`findById media: ${id} ✅`);
    return this.toDomain(row);
  }

  async findByPostId(postId: string): Promise<PostMedia[]> {
    const rows = await this.ormRepo.find({
      where: { postId },
      order: { position: 'ASC' },
    });

    this.logger.log(`findByPostId media: ${postId} → ${rows.length} items`);
    return rows.map((r) => this.toDomain(r));
  }

  async save(media: PostMedia, manager?: EntityManager): Promise<void> {
    const repo = manager
      ? manager.getRepository(PostsMediaEntity)
      : this.ormRepo;
    const obj = media.toObject();

    const entity = repo.create({
      id: obj.id,
      postId: obj.postId,
      type: obj.type as PostMediaType,
      url: obj.url,
      position: obj.position,
      createdAt: obj.createdAt,
    });

    await repo.save(entity);
    this.logger.log(`save media: ${obj.id} 💾`);
  }

  async delete(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager
      ? manager.getRepository(PostsMediaEntity)
      : this.ormRepo;
    await repo.delete({ id });

    this.logger.warn(`delete media: ${id} 🗑`);
  }

  private toDomain(row: PostsMediaEntity): PostMedia {
    return new PostMedia(
      {
        postId: row.postId,
        type: row.type as 'image' | 'video',
        url: row.url,
        position: row.position,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }
}
