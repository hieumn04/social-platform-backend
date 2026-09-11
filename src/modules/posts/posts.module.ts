import { Module } from '@nestjs/common';
import { PostsPersistenceModule } from './infrastructure/repositories/posts-persistence.module';

@Module({
  imports: [PostsPersistenceModule],
  // exports: [LoginModule],
  // controllers: [AuthController],
})
export class PostsModule {}
