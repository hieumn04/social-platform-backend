import { FollowScorePair } from '@/types/typeModel/follows';
import { RawFollowScoreRow, RawRankRow } from '@/types/typeModel/followScore';

export interface FollowsScoreReadRepository {
  findDirtyBatch(limit?: number): Promise<RawFollowScoreRow[]>;

  findPairsForRecompute(pairs: FollowScorePair[]): Promise<RawFollowScoreRow[]>;

  getTopFeedRank(followerId: string, limit?: number): Promise<RawRankRow[]>;

  getTopStoryRank(followerId: string, limit?: number): Promise<RawRankRow[]>;

  getTopDmRank(followerId: string, limit?: number): Promise<RawRankRow[]>;

  getTopSuggestionRank(
    followerId: string,
    limit?: number,
  ): Promise<RawRankRow[]>;
}
