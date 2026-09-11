import { AppLogger } from '@/shared/logger/applogger';
import { FollowScorePair } from '@/types/typeModel/follows';
import { RawFollowScoreRow, RawRankRow } from '@/types/typeModel/followScore';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class FollowsScoreReadRepositoryImpl {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FollowsScoreReadRepositoryImpl.name);
  }

  // =========================================================
  // WORKER: load rows cần recompute
  // =========================================================

  async findDirtyBatch(limit = 500): Promise<RawFollowScoreRow[]> {
    try {
      return await this.dataSource.query(
        `
        SELECT
          follower_id,
          following_id,

          like_count,
          comment_count,
          dm_count,
          story_view_count,
          profile_click_count,

          interaction_score,
          dm_score,
          story_score,
          profile_click_score,
          recency_score,
          ml_score,

          last_event_at,
          last_interaction_at,
          last_dm_at,
          last_story_view_at,
          last_profile_click_at

        FROM follow_score
        WHERE dirty_flag = true
        ORDER BY updated_at ASC
        LIMIT ?
        `,
        [limit],
      );
    } catch (error) {
      this.logger.error('findDirtyBatch failed', { limit, error });
      throw error;
    }
  }

  // =========================================================
  // GRAPH LOOKUP (batch pairs)
  // =========================================================

  async findPairsForRecompute(
    pairs: FollowScorePair[],
  ): Promise<RawFollowScoreRow[]> {
    if (!pairs.length) return [];

    try {
      const derivedSql = pairs
        .map(() => 'SELECT ? AS follower_id, ? AS following_id')
        .join(' UNION ALL ');

      const params: string[] = [];

      for (const p of pairs) {
        params.push(p.followerId, p.followingId);
      }

      return await this.dataSource.query(
        `
        SELECT
          fs.follower_id,
          fs.following_id,

          fs.like_count,
          fs.comment_count,
          fs.dm_count,
          fs.story_view_count,
          fs.profile_click_count,

          fs.interaction_score,
          fs.dm_score,
          fs.story_score,
          fs.profile_click_score,
          fs.recency_score,
          fs.ml_score,

          fs.last_event_at,
          fs.last_interaction_at,
          fs.last_dm_at,
          fs.last_story_view_at,
          fs.last_profile_click_at

        FROM follow_score fs
        JOIN (
          ${derivedSql}
        ) tmp
          ON tmp.follower_id = fs.follower_id
         AND tmp.following_id = fs.following_id
        `,
        params,
      );
    } catch (error) {
      this.logger.error('findPairsForRecompute failed', {
        size: pairs.length,
        error,
      });
      throw error;
    }
  }

  // =========================================================
  // FEED RANKING
  // =========================================================

  async getTopFeedRank(followerId: string, limit = 50): Promise<RawRankRow[]> {
    try {
      return await this.dataSource.query(
        `
        SELECT
          follower_id,
          following_id,
          final_feed_score AS score
        FROM follow_score
        WHERE follower_id = ?
        ORDER BY final_feed_score DESC
        LIMIT ?
        `,
        [followerId, limit],
      );
    } catch (error) {
      this.logger.error('getTopFeedRank failed', {
        followerId,
        limit,
        error,
      });
      throw error;
    }
  }

  // STORY

  async getTopStoryRank(followerId: string, limit = 50): Promise<RawRankRow[]> {
    try {
      return await this.dataSource.query(
        `
        SELECT
          follower_id,
          following_id,
          final_story_score AS score
        FROM follow_score
        WHERE follower_id = ?
        ORDER BY final_story_score DESC
        LIMIT ?
        `,
        [followerId, limit],
      );
    } catch (error) {
      this.logger.error('getTopStoryRank failed', {
        followerId,
        limit,
        error,
      });
      throw error;
    }
  }

  // DM

  async getTopDmRank(followerId: string, limit = 50): Promise<RawRankRow[]> {
    try {
      return await this.dataSource.query(
        `
        SELECT
          follower_id,
          following_id,
          final_dm_score AS score
        FROM follow_score
        WHERE follower_id = ?
        ORDER BY final_dm_score DESC
        LIMIT ?
        `,
        [followerId, limit],
      );
    } catch (error) {
      this.logger.error('getTopDmRank failed', {
        followerId,
        limit,
        error,
      });
      throw error;
    }
  }

  // SUGGESTION

  async getTopSuggestionRank(
    followerId: string,
    limit = 50,
  ): Promise<RawRankRow[]> {
    try {
      return await this.dataSource.query(
        `
        SELECT
          follower_id,
          following_id,
          final_suggestion_score AS score
        FROM follow_score
        WHERE follower_id = ?
        ORDER BY final_suggestion_score DESC
        LIMIT ?
        `,
        [followerId, limit],
      );
    } catch (error) {
      this.logger.error('getTopSuggestionRank failed', {
        followerId,
        limit,
        error,
      });
      throw error;
    }
  }
}
