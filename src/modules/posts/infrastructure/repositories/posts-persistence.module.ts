import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerModule } from 'src/shared/logger/logger.module';

import { PostEntityRepositoryImpl } from './posts.repository';
import { PostEntity } from '../typeorm/posts.entity';
import { PostsMediaEntity } from '../typeorm/post-media.entity';
import { PostMediaEntityRepositoryImpl } from './posts-media.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, PostsMediaEntity]),
    LoggerModule,
  ],
  providers: [
    {
      provide: 'PostRepository',
      useClass: PostEntityRepositoryImpl,
    },
    {
      provide: 'PostMediaRepository',
      useClass: PostMediaEntityRepositoryImpl,
    },
  ],
  exports: ['PostRepository', 'PostMediaRepository', TypeOrmModule],
})
export class PostsPersistenceModule {}
