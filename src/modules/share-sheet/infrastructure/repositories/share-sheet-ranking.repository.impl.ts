import { ShareSheetCandidate } from '@/modules/share-sheet/domain/models/share-sheet-candidate';
import { IShareSheetRankingRepository } from '@/modules/share-sheet/domain/repositories/share-sheet-ranking.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface ShareSheetCandidateRow {
  id: string;
  username: string;
  full_name: string;
  profile_pic_url: string | null;
  is_verified: boolean | number | string;
  direct_conversation_count: number | string;
  last_direct_at: Date | string | null;
  is_following: boolean | number | string;
  is_followed_by: boolean | number | string;
  followed_at: Date | string | null;
  affinity_score: number | string;
  affinity_last_interaction_at: Date | string | null;
  last_dm_at: Date | string | null;
  interaction_score: number | string;
  interaction_last_at: Date | string | null;
}

@Injectable()
export class ShareSheetRankingRepositoryImpl
  implements IShareSheetRankingRepository
{
  constructor(private readonly dataSource: DataSource) {}

  async findCandidates(
    viewerId: string,
    poolLimit: number,
  ): Promise<ShareSheetCandidate[]> {
    const safePoolLimit = Math.min(500, Math.max(1, Math.trunc(poolLimit)));
    const rows = await this.dataSource.query<ShareSheetCandidateRow[]>(
      `WITH direct_signals AS (
         SELECT
           cp2.user_id AS candidate_id,
           MAX(it.last_activity_at) AS last_direct_at,
           COUNT(DISTINCT cp1.conversation_id) AS direct_conversation_count
         FROM conversation_participants cp1
         JOIN conversation_participants cp2
           ON cp2.conversation_id = cp1.conversation_id
          AND cp2.status = 'ACTIVE'
          AND cp2.user_id <> cp1.user_id
         LEFT JOIN inbox_threads it
           ON it.viewer_id = cp1.user_id
          AND it.conversation_id = cp1.conversation_id
         WHERE cp1.user_id = ?
           AND cp1.status = 'ACTIVE'
         GROUP BY cp2.user_id
       ),
       follow_signals AS (
         SELECT
           candidate_id,
           MAX(is_following) AS is_following,
           MAX(is_followed_by) AS is_followed_by,
           MAX(followed_at) AS followed_at
         FROM (
           SELECT
             following_id AS candidate_id,
             1 AS is_following,
             0 AS is_followed_by,
             created_at AS followed_at
           FROM follow_edge
           WHERE follower_id = ?
           UNION ALL
           SELECT
             follower_id AS candidate_id,
             0 AS is_following,
             1 AS is_followed_by,
             created_at AS followed_at
           FROM follow_edge
           WHERE following_id = ?
         ) relation_rows
         GROUP BY candidate_id
       ),
       affinity_signals AS (
         SELECT
           following_id AS candidate_id,
           GREATEST(
             COALESCE(final_dm_score, 0),
             COALESCE(dm_score, 0),
             COALESCE(interaction_score, 0)
           ) AS affinity_score,
           last_interaction_at AS affinity_last_interaction_at,
           last_dm_at
         FROM follow_score
         WHERE follower_id = ?
       ),
       interaction_signals AS (
         SELECT
           target_user_id AS candidate_id,
           interaction_score,
           last_interaction_at
         FROM user_interaction_edge
         WHERE viewer_id = ?
       ),
       candidate_ids AS (
         SELECT candidate_id FROM direct_signals
         UNION
         SELECT candidate_id FROM follow_signals
         UNION
         SELECT candidate_id FROM affinity_signals
         UNION
         SELECT candidate_id FROM interaction_signals
       )
       SELECT
         CAST(u.user_id AS CHAR) AS id,
         u.username,
         u.full_name,
         u.avatar_url AS profile_pic_url,
         u.is_verified,
         COALESCE(ds.direct_conversation_count, 0) AS direct_conversation_count,
         ds.last_direct_at,
         COALESCE(fs.is_following, 0) AS is_following,
         COALESCE(fs.is_followed_by, 0) AS is_followed_by,
         fs.followed_at,
         COALESCE(afs.affinity_score, 0) AS affinity_score,
         afs.affinity_last_interaction_at,
         afs.last_dm_at,
         COALESCE(ins.interaction_score, 0) AS interaction_score,
         ins.last_interaction_at AS interaction_last_at
       FROM candidate_ids ci
       JOIN users u ON u.user_id = ci.candidate_id
       LEFT JOIN direct_signals ds ON ds.candidate_id = ci.candidate_id
       LEFT JOIN follow_signals fs ON fs.candidate_id = ci.candidate_id
       LEFT JOIN affinity_signals afs ON afs.candidate_id = ci.candidate_id
       LEFT JOIN interaction_signals ins ON ins.candidate_id = ci.candidate_id
       WHERE u.user_id <> ?
         AND u.is_active = true
         AND u.is_deleted = false
         AND NOT EXISTS (
           SELECT 1
           FROM block_edge b
           WHERE (b.blocker_id = ? AND b.blocked_id = u.user_id)
              OR (b.blocker_id = u.user_id AND b.blocked_id = ?)
         )
       ORDER BY
         (ds.candidate_id IS NOT NULL) DESC,
         ds.last_direct_at DESC,
         afs.affinity_score DESC,
         (fs.candidate_id IS NOT NULL) DESC,
         fs.followed_at DESC,
         u.user_id DESC
       LIMIT ?`,
      [
        viewerId,
        viewerId,
        viewerId,
        viewerId,
        viewerId,
        viewerId,
        viewerId,
        viewerId,
        safePoolLimit,
      ],
    );

    return rows.map((row) => ({
      id: String(row.id),
      username: row.username,
      fullName: row.full_name,
      profilePicUrl: row.profile_pic_url,
      isVerified: this.toBoolean(row.is_verified),
      directConversationCount: Number(row.direct_conversation_count),
      lastDirectAt: this.toDate(row.last_direct_at),
      isFollowing: this.toBoolean(row.is_following),
      isFollowedBy: this.toBoolean(row.is_followed_by),
      followedAt: this.toDate(row.followed_at),
      affinityScore: Number(row.affinity_score),
      affinityLastInteractionAt: this.toDate(row.affinity_last_interaction_at),
      lastDmAt: this.toDate(row.last_dm_at),
      interactionScore: Number(row.interaction_score),
      interactionLastAt: this.toDate(row.interaction_last_at),
    }));
  }

  private toBoolean(value: boolean | number | string): boolean {
    return value === true || value === 1 || value === '1';
  }

  private toDate(value: Date | string | null): Date | null {
    if (!value) return null;
    return value instanceof Date ? value : new Date(value);
  }
}
