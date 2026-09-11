import { RecipientSearchResult } from '@/modules/recipient-search/domain/models/recipient-search-result';
import { IRecipientSearchRepository } from '@/modules/recipient-search/domain/repositories/recipient-search.repository';
import { ConversationSubtype } from '@/shared/enums/roomStatus.enum';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface RecipientSearchRow {
  id: string;
  username: string;
  full_name: string;
  profile_pic_url: string | null;
  is_verified: boolean | number | string;
  thread_fbid: string | null;
}

@Injectable()
export class RecipientSearchRepositoryImpl
  implements IRecipientSearchRepository
{
  constructor(private readonly dataSource: DataSource) {}

  async search(
    viewerId: string,
    normalizedQuery: string,
    limit: number,
  ): Promise<RecipientSearchResult[]> {
    const rows = await this.dataSource.query<RecipientSearchRow[]>(
      `WITH search_input AS (
         SELECT ? AS keyword
       ),
       latest_direct_thread AS (
         SELECT candidate_id, thread_fbid
         FROM (
           SELECT
             cp2.user_id AS candidate_id,
             it.thread_fbid,
             ROW_NUMBER() OVER (
               PARTITION BY cp2.user_id
               ORDER BY it.last_activity_at DESC, it.thread_fbid DESC
             ) AS recipient_rank
           FROM conversation_participants cp1
           JOIN conversation_participants cp2
             ON cp2.conversation_id = cp1.conversation_id
            AND cp2.user_id <> cp1.user_id
            AND cp2.status = 'ACTIVE'
           JOIN conversations c
             ON c.conversation_id = cp1.conversation_id
            AND c.subtype = ?
           JOIN inbox_threads it
             ON it.viewer_id = cp1.user_id
            AND it.conversation_id = cp1.conversation_id
           WHERE cp1.user_id = ?
             AND cp1.status = 'ACTIVE'
         ) ranked_threads
         WHERE recipient_rank = 1
       ),
       follow_signals AS (
         SELECT
           candidate_id,
           MAX(is_following) AS is_following,
           MAX(is_followed_by) AS is_followed_by
         FROM (
           SELECT following_id AS candidate_id, 1 AS is_following, 0 AS is_followed_by
           FROM follow_edge
           WHERE follower_id = ?
           UNION ALL
           SELECT follower_id AS candidate_id, 0 AS is_following, 1 AS is_followed_by
           FROM follow_edge
           WHERE following_id = ?
         ) relation_rows
         GROUP BY candidate_id
       )
       SELECT
         CAST(u.user_id AS CHAR) AS id,
         u.username,
         u.full_name,
         u.avatar_url AS profile_pic_url,
         u.is_verified,
         CAST(ldt.thread_fbid AS CHAR) AS thread_fbid
       FROM users u
       CROSS JOIN search_input si
       LEFT JOIN latest_direct_thread ldt ON ldt.candidate_id = u.user_id
       LEFT JOIN follow_signals fs ON fs.candidate_id = u.user_id
       WHERE u.user_id <> ?
         AND u.is_active = true
         AND u.is_deleted = false
         AND (
           LOCATE(si.keyword, LOWER(u.username)) > 0
           OR LOCATE(si.keyword, LOWER(u.full_name)) > 0
         )
         AND NOT EXISTS (
           SELECT 1
           FROM block_edge b
           WHERE (b.blocker_id = ? AND b.blocked_id = u.user_id)
              OR (b.blocker_id = u.user_id AND b.blocked_id = ?)
         )
       ORDER BY
         CASE
           WHEN LOWER(u.username) = si.keyword THEN 0
           WHEN LOCATE(si.keyword, LOWER(u.username)) = 1 THEN 1
           WHEN LOCATE(si.keyword, LOWER(u.full_name)) = 1 THEN 2
           WHEN LOCATE(si.keyword, LOWER(u.username)) > 0 THEN 3
           ELSE 4
         END,
         COALESCE(fs.is_following, 0) DESC,
         (ldt.thread_fbid IS NOT NULL) DESC,
         COALESCE(fs.is_followed_by, 0) DESC,
         u.is_verified DESC,
         u.username ASC,
         u.user_id DESC
       LIMIT ?`,
      [
        normalizedQuery,
        ConversationSubtype.ONE_TO_ONE,
        viewerId,
        viewerId,
        viewerId,
        viewerId,
        viewerId,
        viewerId,
        limit,
      ],
    );

    return rows.map((row) => ({
      id: String(row.id),
      username: row.username,
      fullName: row.full_name,
      profilePicUrl: row.profile_pic_url,
      isVerified: this.toBoolean(row.is_verified),
      threadFbid: row.thread_fbid ? String(row.thread_fbid) : null,
    }));
  }

  private toBoolean(value: boolean | number | string): boolean {
    return value === true || value === 1 || value === '1';
  }
}
