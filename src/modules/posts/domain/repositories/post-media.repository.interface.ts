import { PostMedia } from '../models/postmedia.model';

export interface PostMediaRepository {
  findById(id: string): Promise<PostMedia | null>;

  findByPostId(postId: string): Promise<PostMedia[]>;

  save(media: PostMedia): Promise<void>;

  delete(id: string): Promise<void>;
}
