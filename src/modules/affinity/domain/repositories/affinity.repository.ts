import { FollowScore } from '../models/follow-score';

export interface IAffinityRepository {
  getScore(viewerId: string, targetUserId: string): Promise<FollowScore | null>;
  upsertScore(score: Partial<FollowScore> & { viewerId: string, targetUserId: string }): Promise<void>;
  markAsDirty(viewerId: string, targetUserId: string): Promise<void>;
  getTopAffinity(viewerId: string, limit: number): Promise<FollowScore[]>;
}
