import { FollowRequestEdge } from '../models/follow-request-edge';

export interface IFollowRequestEdgeRepository {
  getEdge(
    requesterId: string,
    targetUserId: string,
  ): Promise<FollowRequestEdge | null>;
  createEdge(requesterId: string, targetUserId: string): Promise<void>;
  deleteEdge(requesterId: string, targetUserId: string): Promise<void>;
}
