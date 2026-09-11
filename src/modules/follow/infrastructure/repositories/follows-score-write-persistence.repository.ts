import { AppLogger } from '@/shared/logger/applogger';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class FollowsScoreWriteRepositoryImpl {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FollowsScoreWriteRepositoryImpl.name);
  }

  async insertDefault(followerId: string, followingId: string): Promise<void> {
    try {
      await this.dataSource.query(
        `
      INSERT INTO follow_score (
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
        final_feed_score,
        final_story_score,
        final_dm_score,
        final_suggestion_score,
        affinity_level,
        dirty_flag,
        version
      )
      VALUES (?, ?, 0,0,0,0,0, 0,0,0,0,0, 0, 0,0,0,0, 0, true, 0)
      ON DUPLICATE KEY UPDATE
        follower_id = follower_id
      `,
        [followerId, followingId],
      );
    } catch (error) {
      this.logger.error('insertDefault follow_score failed', {
        followerId,
        followingId,
        error,
      });
      throw error;
    }
  }

  async markInteractionDirty(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    try {
      await this.dataSource.query(
        `
      INSERT INTO follow_score (
        follower_id,
        following_id,
        dirty_flag
      )
      VALUES (?, ?, true)
      ON DUPLICATE KEY UPDATE
        dirty_flag = true,
        updated_at = NOW()
      `,
        [followerId, followingId],
      );
    } catch (error) {
      this.logger.error('markInteractionDirty failed', {
        followerId,
        followingId,
        error,
      });
      throw error;
    }
  }
}
