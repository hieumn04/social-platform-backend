import { Post } from '../models/posts.model';

export interface PostRepository {
  findById(id: string): Promise<Post | null>;
  findByUserId(userId: string): Promise<Post[]>;
  save(post: Post): Promise<void>;
  delete(postId: string): Promise<void>;
}
