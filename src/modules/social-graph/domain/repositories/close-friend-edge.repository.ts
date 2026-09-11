import { CloseFriendEdge } from '../models/close-friend-edge';

export interface ICloseFriendEdgeRepository {
  getEdge(userId: string, closeFriendId: string): Promise<CloseFriendEdge | null>;
  createEdge(userId: string, closeFriendId: string): Promise<void>;
  deleteEdge(userId: string, closeFriendId: string): Promise<void>;
}
