import {
  FollowMutationResult,
  FriendshipStatusSnapshot,
  ISocialGraphRepository,
  SocialGraphUser,
} from '@/modules/social-graph/domain/repositories/social-graph.repository';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

type QueryExecutor = Pick<DataSource, 'query'> | Pick<EntityManager, 'query'>;

interface UserRow {
  user_id: string;
  username: string;
  is_private: boolean | number | string;
}

interface FriendshipStatusRow {
  following: boolean | number | string;
  outgoing_request: boolean | number | string;
  incoming_request: boolean | number | string;
  followed_by: boolean | number | string;
  is_bestie: boolean | number | string;
  is_private: boolean | number | string;
  is_restricted: boolean | number | string;
  blocking: boolean | number | string;
  blocked_by: boolean | number | string;
}

@Injectable()
export class SocialGraphRepositoryImpl implements ISocialGraphRepository {
  constructor(private readonly dataSource: DataSource) {}

  async follow(
    actorId: string,
    targetId: string,
  ): Promise<FollowMutationResult> {
    return this.dataSource.transaction(async (manager) => {
      const target = await this.findActiveUser(manager, targetId, true);
      if (!target) return { kind: 'TARGET_NOT_FOUND' };

      if (await this.isBlockedBetween(manager, actorId, targetId)) {
        return { kind: 'FOLLOW_FORBIDDEN' };
      }

      const existingFollow = await manager.query<Array<{ found: number }>>(
        `SELECT 1 AS found
         FROM follow_edge
         WHERE follower_id = ? AND following_id = ?
         LIMIT 1`,
        [actorId, targetId],
      );

      let kind: 'FOLLOWING' | 'REQUESTED';

      if (existingFollow.length > 0) {
        kind = 'FOLLOWING';
      } else if (this.toBoolean(target.is_private)) {
        await manager.query(
          `INSERT INTO follow_request_edge (
             requester_id,
             target_user_id,
             created_at
           )
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE created_at = created_at`,
          [actorId, targetId],
        );
        kind = 'REQUESTED';
      } else {
        await manager.query(
          `INSERT IGNORE INTO follow_edge (
             follower_id,
             following_id,
             created_at
           ) VALUES (?, ?, CURRENT_TIMESTAMP)`,
          [actorId, targetId],
        );
        await manager.query(
          `DELETE FROM follow_request_edge
           WHERE requester_id = ? AND target_user_id = ?`,
          [actorId, targetId],
        );
        kind = 'FOLLOWING';
      }

      return {
        kind,
        user: this.mapUser(target),
        friendshipStatus: await this.loadFriendshipStatus(
          manager,
          actorId,
          targetId,
        ),
      };
    });
  }

  async unfollow(
    actorId: string,
    targetId: string,
  ): Promise<FollowMutationResult> {
    return this.dataSource.transaction(async (manager) => {
      const target = await this.findActiveUser(manager, targetId, true);
      if (!target) return { kind: 'TARGET_NOT_FOUND' };

      await manager.query(
        `DELETE FROM follow_edge
         WHERE follower_id = ? AND following_id = ?`,
        [actorId, targetId],
      );
      await manager.query(
        `DELETE FROM follow_request_edge
         WHERE requester_id = ? AND target_user_id = ?`,
        [actorId, targetId],
      );

      return {
        kind: 'UNFOLLOWED',
        user: this.mapUser(target),
        friendshipStatus: await this.loadFriendshipStatus(
          manager,
          actorId,
          targetId,
        ),
      };
    });
  }

  async acceptFollowRequest(
    receiverId: string,
    senderId: string,
  ): Promise<FollowMutationResult> {
    return this.dataSource.transaction(async (manager) => {
      const sender = await this.findActiveUser(manager, senderId, true);
      if (!sender) return { kind: 'TARGET_NOT_FOUND' };

      if (await this.isBlockedBetween(manager, receiverId, senderId)) {
        return { kind: 'FOLLOW_FORBIDDEN' };
      }

      const pending = await manager.query<Array<{ found: number }>>(
        `SELECT 1 AS found
         FROM follow_request_edge
         WHERE requester_id = ? AND target_user_id = ?
         LIMIT 1
         FOR UPDATE`,
        [senderId, receiverId],
      );

      if (pending.length === 0) return { kind: 'REQUEST_NOT_FOUND' };

      await manager.query(
        `INSERT IGNORE INTO follow_edge (
           follower_id,
           following_id,
           created_at
         ) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [senderId, receiverId],
      );
      await manager.query(
        `DELETE FROM follow_request_edge
         WHERE requester_id = ? AND target_user_id = ?`,
        [senderId, receiverId],
      );

      return {
        kind: 'ACCEPTED',
        user: this.mapUser(sender),
        friendshipStatus: await this.loadFriendshipStatus(
          manager,
          receiverId,
          senderId,
        ),
      };
    });
  }

  async blockUser(
    blockerId: string,
    blockedId: string,
  ): Promise<FollowMutationResult> {
    return this.dataSource.transaction(async (manager) => {
      const blockedUser = await this.findActiveUser(manager, blockedId, true);
      if (!blockedUser) return { kind: 'TARGET_NOT_FOUND' };

      await manager.query(
        `DELETE FROM follow_edge
         WHERE (follower_id = ? AND following_id = ?)
            OR (follower_id = ? AND following_id = ?)`,
        [blockerId, blockedId, blockedId, blockerId],
      );
      await manager.query(
        `DELETE FROM follow_request_edge
         WHERE (requester_id = ? AND target_user_id = ?)
            OR (requester_id = ? AND target_user_id = ?)`,
        [blockerId, blockedId, blockedId, blockerId],
      );
      await manager.query(
        `INSERT IGNORE INTO block_edge (blocker_id, blocked_id, created_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [blockerId, blockedId],
      );

      return {
        kind: 'BLOCKED',
        user: this.mapUser(blockedUser),
        friendshipStatus: await this.loadFriendshipStatus(
          manager,
          blockerId,
          blockedId,
        ),
      };
    });
  }

  async getFriendshipStatus(
    viewerId: string,
    targetId: string,
  ): Promise<FriendshipStatusSnapshot | null> {
    const target = await this.findActiveUser(this.dataSource, targetId, false);
    if (!target) return null;

    return this.loadFriendshipStatus(this.dataSource, viewerId, targetId);
  }

  private async findActiveUser(
    executor: QueryExecutor,
    userId: string,
    lock: boolean,
  ): Promise<UserRow | null> {
    const rows = await executor.query<UserRow[]>(
      `SELECT user_id, username, is_private
       FROM users
       WHERE user_id = ? AND is_active = true AND is_deleted = false
       LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
      [userId],
    );

    return rows[0] ?? null;
  }

  private async isBlockedBetween(
    executor: QueryExecutor,
    actorId: string,
    targetId: string,
  ): Promise<boolean> {
    const rows = await executor.query<Array<{ found: number }>>(
      `SELECT 1 AS found
       FROM block_edge
       WHERE (blocker_id = ? AND blocked_id = ?)
          OR (blocker_id = ? AND blocked_id = ?)
       LIMIT 1`,
      [actorId, targetId, targetId, actorId],
    );

    return rows.length > 0;
  }

  private async loadFriendshipStatus(
    executor: QueryExecutor,
    viewerId: string,
    targetId: string,
  ): Promise<FriendshipStatusSnapshot> {
    const rows = await executor.query<FriendshipStatusRow[]>(
      `SELECT
         u.is_private,
         EXISTS(
           SELECT 1 FROM follow_edge
           WHERE follower_id = ? AND following_id = ?
         ) AS following,
         EXISTS(
           SELECT 1 FROM follow_edge
           WHERE follower_id = ? AND following_id = ?
         ) AS followed_by,
         EXISTS(
           SELECT 1 FROM follow_request_edge
           WHERE requester_id = ? AND target_user_id = ?
         ) AS outgoing_request,
         EXISTS(
           SELECT 1 FROM follow_request_edge
           WHERE requester_id = ? AND target_user_id = ?
         ) AS incoming_request,
         EXISTS(
           SELECT 1 FROM close_friend_edge
           WHERE user_id = ? AND target_user_id = ?
         ) AS is_bestie,
         EXISTS(
           SELECT 1 FROM restrict_edge
           WHERE restrictor_id = ? AND restricted_id = ?
         ) AS is_restricted,
         EXISTS(
           SELECT 1 FROM block_edge
           WHERE blocker_id = ? AND blocked_id = ?
         ) AS blocking,
         EXISTS(
           SELECT 1 FROM block_edge
           WHERE blocker_id = ? AND blocked_id = ?
         ) AS blocked_by
       FROM users u
       WHERE u.user_id = ?
       LIMIT 1`,
      [
        viewerId,
        targetId,
        targetId,
        viewerId,
        viewerId,
        targetId,
        targetId,
        viewerId,
        viewerId,
        targetId,
        viewerId,
        targetId,
        viewerId,
        targetId,
        targetId,
        viewerId,
        targetId,
      ],
    );
    const row = rows[0];

    return {
      following: this.toBoolean(row?.following),
      outgoing_request: this.toBoolean(row?.outgoing_request),
      incoming_request: this.toBoolean(row?.incoming_request),
      followed_by: this.toBoolean(row?.followed_by),
      is_bestie: this.toBoolean(row?.is_bestie),
      is_private: this.toBoolean(row?.is_private),
      is_restricted: this.toBoolean(row?.is_restricted),
      is_feed_favorite: false,
      blocking: this.toBoolean(row?.blocking),
      blocked_by: this.toBoolean(row?.blocked_by),
    };
  }

  private mapUser(row: UserRow): SocialGraphUser {
    return {
      id: String(row.user_id),
      username: row.username,
      isPrivate: this.toBoolean(row.is_private),
    };
  }

  private toBoolean(value: boolean | number | string | undefined): boolean {
    return value === true || value === 1 || value === '1';
  }
}
