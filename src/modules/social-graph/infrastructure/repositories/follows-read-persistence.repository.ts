import { AppLogger } from '@/shared/logger/applogger';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserFollowStatus } from '@/shared/enums/user-follow-status.enum';
import {
  FollowersCandidateRow,
  FollowersCursor,
  FollowRow,
  FriendshipStatusModel,
  IncomingFollowRow,
} from '@/types/typeModel/follows';
import { FollowsReadRepository } from '@/modules/follow/domain/repositories/follows.repository.interface';

@Injectable()
export class FollowsReadRepositoryImpl implements FollowsReadRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FollowsReadRepositoryImpl.name);
  }

  // async findFriendshipStatus(
  //   viewerId: string,
  //   targetUserId: string,
  // ): Promise<FriendshipStatusModel> {
  //   try {
  //     const rows: FollowRow[] = await this.dataSource.query(
  //       `
  //       SELECT
  //         follower_id,
  //         following_id,
  //         status,
  //         is_restricted,
  //         is_bestie,
  //         is_feed_favorite
  //       FROM user_follow
  //       WHERE
  //         (follower_id = ? AND following_id = ?)
  //         OR
  //         (follower_id = ? AND following_id = ?)
  //       LIMIT 2
  //       `,
  //       [viewerId, targetUserId, targetUserId, viewerId],
  //     );

  //     let viewerToTarget: FollowRow | null = null;
  //     let targetToViewer: FollowRow | null = null;

  //     for (const row of rows) {
  //       if (row.follower_id === viewerId && row.following_id === targetUserId) {
  //         viewerToTarget = row;
  //       } else {
  //         targetToViewer = row;
  //       }
  //     }

  //     const viewerStatus = viewerToTarget?.status;
  //     const targetStatus = targetToViewer?.status;

  //     if (
  //       targetStatus === UserFollowStatus.BLOCKED_HARD ||
  //       targetStatus === UserFollowStatus.BLOCKED_SOFT
  //     ) {
  //       return {
  //         following: false,
  //         outgoing_request: false,
  //         incoming_request: false,
  //         is_restricted: false,
  //         isBestie: false,
  //         isFeedFavorite: false,
  //       };
  //     }

  //     return {
  //       following: viewerStatus === UserFollowStatus.ACCEPTED,
  //       outgoingRequest: viewerStatus === UserFollowStatus.PENDING,
  //       incomingRequest: targetStatus === UserFollowStatus.PENDING,
  //       isRestricted: viewerToTarget?.is_restricted ?? false,
  //       isBestie: viewerToTarget?.is_bestie ?? false,
  //       isFeedFavorite: viewerToTarget?.is_feed_favorite ?? false,
  //     };
  //   } catch (err) {
  //     this.logger.error('findFriendshipStatus failed', { error: err });
  //     throw err;
  //   }
  // }

  async findFollowersCandidates(
    targetUserId: string,
    limit = 100,
    cursor?: FollowersCursor,
  ): Promise<{
    rows: FollowersCandidateRow[];
    nextCursor: FollowersCursor | null;
  }> {
    try {
      const params: any[] = [targetUserId, UserFollowStatus.ACCEPTED];
      let cursorCondition = '';

      // cursor pagination (seek method — không dùng offset)
      if (cursor) {
        params.push(cursor.createdAt);
        params.push(cursor.createdAt, cursor.followerId);

        cursorCondition = `
        AND (
          created_at < ?
          OR (created_at = ? AND follower_id < ?)
        )
      `;
      }

      const rows: FollowersCandidateRow[] = await this.dataSource.query(
        `
      SELECT
        follower_id,
        created_at,
        interaction_rank,
        last_interaction_at,
        accepted_at,
        removed_at,
        muted_story,
        muted_post,
        is_restricted,
        is_bestie,
        is_feed_favorite
      FROM user_follow
      WHERE following_id = ?
        AND status = ?
        ${cursorCondition}
      ORDER BY created_at DESC, follower_id DESC
      LIMIT ?
      `,
        [...params, limit],
      );

      if (!rows.length) {
        return { rows: [], nextCursor: null };
      }

      const last = rows[rows.length - 1];

      return {
        rows,
        nextCursor: {
          createdAt: last.created_at,
          followerId: last.follower_id,
        },
      };
    } catch (err) {
      this.logger.error('findFollowersCandidates failed', { error: err });
      throw err;
    }
  }

  async findMutualFollows(
    viewerId: string,
    candidateFollowerIds: string[],
  ): Promise<Set<string>> {
    if (!candidateFollowerIds.length) {
      return new Set();
    }

    try {
      const rows: { following_id: string }[] = await this.dataSource.query(
        `
      SELECT following_id
      FROM user_follow
      WHERE follower_id = ?
        AND status = ?
        AND following_id IN (?)
      `,
        [viewerId, UserFollowStatus.ACCEPTED, candidateFollowerIds],
      );

      return new Set(rows.map((r) => r.following_id));
    } catch (err) {
      this.logger.error('findMutualFollows failed', { error: err });
      throw err;
    }
  }

  async findOutgoingRelationships(
    viewerId: string,
    targetUserIds: string[],
  ): Promise<Map<string, FollowRow>> {
    if (!targetUserIds.length) {
      return new Map();
    }

    try {
      const placeholders = targetUserIds.map(() => '?').join(',');

      const rows: FollowRow[] = await this.dataSource.query(
        `
      SELECT
        follower_id,
        following_id,
        status,
        is_restricted,
        is_bestie,
        is_feed_favorite
      FROM user_follow
      WHERE follower_id = ?
        AND following_id IN (${placeholders})
        AND status IN (?, ?)
      `,
        [
          viewerId,
          ...targetUserIds,
          UserFollowStatus.ACCEPTED,
          UserFollowStatus.PENDING,
        ],
      );

      return new Map(rows.map((row) => [row.following_id, row]));
    } catch (err) {
      this.logger.error('findOutgoingRelationships failed', { error: err });
      throw err;
    }
  }

  async findIncomingRelationships(
    viewerId: string,
    targetUserIds: string[],
  ): Promise<Map<string, IncomingFollowRow>> {
    if (!targetUserIds.length) {
      return new Map();
    }

    try {
      const placeholders = targetUserIds.map(() => '?').join(',');

      const rows: IncomingFollowRow[] = await this.dataSource.query(
        `
      SELECT
        follower_id,
        following_id,
        status
      FROM user_follow
      WHERE following_id = ?
        AND follower_id IN (${placeholders})
        AND status IN (?, ?)
      `,
        [
          viewerId,
          ...targetUserIds,
          UserFollowStatus.ACCEPTED,
          UserFollowStatus.PENDING,
        ],
      );

      return new Map(rows.map((row) => [row.follower_id, row]));
    } catch (err) {
      this.logger.error('findIncomingRelationships failed', { error: err });
      throw err;
    }
  }
}
