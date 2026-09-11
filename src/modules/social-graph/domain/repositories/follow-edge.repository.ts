import { FollowEdge } from '../models/follow-edge';

export interface IFollowEdgeRepository {
  getEdge(followerId: string, followingId: string): Promise<FollowEdge | null>;
  createEdge(followerId: string, followingId: string): Promise<void>;
  deleteEdge(followerId: string, followingId: string): Promise<void>;
}
