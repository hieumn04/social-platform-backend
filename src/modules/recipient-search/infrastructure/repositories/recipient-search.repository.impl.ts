import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { RecipientSearchResult } from '@/modules/recipient-search/domain/models/recipient-search-result';
import { IRecipientSearchRepository } from '@/modules/recipient-search/domain/repositories/recipient-search.repository';
import { ConversationSubtype } from '@/shared/enums/roomStatus.enum';
import { UserDirectorySearchService } from '@/shared/search/user-directory-search.service';

interface CandidateRow {
  id: string;
  mutual_count?: number | string;
}

interface HydratedRecipientRow {
  id: string;
  username: string;
  full_name: string;
  profile_pic_url: string | null;
  is_verified: boolean | number | string;
  is_following: boolean | number | string;
  is_followed_by: boolean | number | string;
  thread_fbid: string | null;
  thread_last_activity_at: Date | string | null;
  final_dm_score: number | string | null;
  interaction_score: number | string | null;
}

interface CandidateSignals {
  elasticsearchScore: number;
  mutualCount: number;
}

interface RankedRecipient extends RecipientSearchResult {
  lexicalTier: number;
  relationTier: number;
  elasticsearchScore: number;
  mutualCount: number;
  dmScore: number;
  interactionScore: number;
  lastActivityMs: number;
}

@Injectable()
export class RecipientSearchRepositoryImpl
  implements IRecipientSearchRepository
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly directory: UserDirectorySearchService,
  ) {}

  async search(
    viewerId: string,
    normalizedQuery: string,
    limit: number,
  ): Promise<RecipientSearchResult[]> {
    const [directoryCandidates, following, direct, secondDegree] =
      await Promise.all([
        this.directory.search(normalizedQuery, 100),
        this.findFollowing(viewerId, normalizedQuery),
        this.findRecentDirect(viewerId, normalizedQuery),
        this.findSecondDegree(viewerId, normalizedQuery),
      ]);

    const globalCandidates =
      directoryCandidates ??
      (await this.findSafeDatabaseFallback(viewerId, normalizedQuery));
    const signals = new Map<string, CandidateSignals>();

    for (const candidate of [...following, ...direct]) {
      this.ensureCandidate(signals, candidate.id);
    }
    for (const candidate of secondDegree) {
      const value = this.ensureCandidate(signals, candidate.id);
      value.mutualCount = Math.max(
        value.mutualCount,
        Number(candidate.mutual_count ?? 0),
      );
    }
    for (const candidate of globalCandidates) {
      const value = this.ensureCandidate(signals, candidate.userId);
      value.elasticsearchScore = Math.max(
        value.elasticsearchScore,
        candidate.score,
      );
    }

    signals.delete(String(viewerId));
    const candidateIds = [...signals.keys()].slice(0, 220);
    if (!candidateIds.length) return [];

    const rows = await this.hydrateAuthorizedCandidates(viewerId, candidateIds);
    const ranked = rows.map((row) =>
      this.rank(row, signals.get(String(row.id))!, normalizedQuery),
    );

    ranked.sort((a, b) => {
      return (
        b.lexicalTier - a.lexicalTier ||
        b.relationTier - a.relationTier ||
        b.dmScore - a.dmScore ||
        b.lastActivityMs - a.lastActivityMs ||
        b.mutualCount - a.mutualCount ||
        b.interactionScore - a.interactionScore ||
        b.elasticsearchScore - a.elasticsearchScore ||
        Number(b.isVerified) - Number(a.isVerified) ||
        a.username.localeCompare(b.username) ||
        b.id.localeCompare(a.id)
      );
    });

    return ranked.slice(0, Math.min(limit, 10)).map((recipient) => ({
      id: recipient.id,
      username: recipient.username,
      fullName: recipient.fullName,
      profilePicUrl: recipient.profilePicUrl,
      isVerified: recipient.isVerified,
      threadFbid: recipient.threadFbid,
    }));
  }

  private findFollowing(
    viewerId: string,
    query: string,
  ): Promise<CandidateRow[]> {
    return this.dataSource.query<CandidateRow[]>(
      `SELECT CAST(f.following_id AS CHAR) AS id
       FROM follow_edge f
       JOIN users u ON u.user_id = f.following_id
       WHERE f.follower_id = ?
         AND u.is_active = true
         AND u.is_deleted = false
         AND (
           LOWER(u.username) LIKE CONCAT('%', ?, '%')
           OR LOWER(u.full_name) LIKE CONCAT('%', ?, '%')
         )
       ORDER BY f.created_at DESC
       LIMIT 40`,
      [viewerId, query, query],
    );
  }

  private findRecentDirect(
    viewerId: string,
    query: string,
  ): Promise<CandidateRow[]> {
    return this.dataSource.query<CandidateRow[]>(
      `SELECT CAST(it.counterparty_user_id AS CHAR) AS id
       FROM inbox_threads it
       JOIN users u ON u.user_id = it.counterparty_user_id
       WHERE it.viewer_id = ?
         AND it.thread_subtype = ?
         AND it.counterparty_user_id IS NOT NULL
         AND u.is_active = true
         AND u.is_deleted = false
         AND (
           LOWER(u.username) LIKE CONCAT('%', ?, '%')
           OR LOWER(u.full_name) LIKE CONCAT('%', ?, '%')
         )
       GROUP BY it.counterparty_user_id
       ORDER BY MAX(it.last_activity_at) DESC
       LIMIT 40`,
      [viewerId, ConversationSubtype.ONE_TO_ONE, query, query],
    );
  }

  private findSecondDegree(
    viewerId: string,
    query: string,
  ): Promise<CandidateRow[]> {
    return this.dataSource.query<CandidateRow[]>(
      `WITH recent_bridges AS (
         SELECT following_id
         FROM follow_edge
         WHERE follower_id = ?
         ORDER BY created_at DESC
         LIMIT 100
       )
       SELECT
         CAST(f2.following_id AS CHAR) AS id,
         COUNT(DISTINCT rb.following_id) AS mutual_count
       FROM recent_bridges rb
       JOIN follow_edge f2 ON f2.follower_id = rb.following_id
       JOIN users u ON u.user_id = f2.following_id
       WHERE f2.following_id <> ?
         AND u.is_active = true
         AND u.is_deleted = false
         AND (
           LOWER(u.username) LIKE CONCAT('%', ?, '%')
           OR LOWER(u.full_name) LIKE CONCAT('%', ?, '%')
         )
       GROUP BY f2.following_id
       ORDER BY mutual_count DESC
       LIMIT 50`,
      [viewerId, viewerId, query, query],
    );
  }

  private async findSafeDatabaseFallback(
    viewerId: string,
    query: string,
  ): Promise<Array<{ userId: string; score: number }>> {
    const rows = await this.dataSource.query<CandidateRow[]>(
      `SELECT CAST(u.user_id AS CHAR) AS id
       FROM users u
       WHERE u.user_id <> ?
         AND u.is_active = true
         AND u.is_deleted = false
         AND (u.username = ? OR u.username LIKE CONCAT(?, '%'))
       ORDER BY (u.username = ?) DESC, u.is_verified DESC, u.username
       LIMIT 100`,
      [viewerId, query, query, query],
    );
    return rows.map((row) => ({ userId: String(row.id), score: 0 }));
  }

  private hydrateAuthorizedCandidates(
    viewerId: string,
    candidateIds: string[],
  ): Promise<HydratedRecipientRow[]> {
    const placeholders = candidateIds.map(() => '?').join(',');
    return this.dataSource.query<HydratedRecipientRow[]>(
      `SELECT
         CAST(u.user_id AS CHAR) AS id,
         u.username,
         u.full_name,
         u.avatar_url AS profile_pic_url,
         u.is_verified,
         EXISTS(
           SELECT 1 FROM follow_edge f
           WHERE f.follower_id = ? AND f.following_id = u.user_id
         ) AS is_following,
         EXISTS(
           SELECT 1 FROM follow_edge f
           WHERE f.follower_id = u.user_id AND f.following_id = ?
         ) AS is_followed_by,
         (
           SELECT CAST(it.thread_fbid AS CHAR)
           FROM inbox_threads it
           WHERE it.viewer_id = ?
             AND it.counterparty_user_id = u.user_id
             AND it.thread_subtype = ?
           ORDER BY it.last_activity_at DESC, it.thread_fbid DESC
           LIMIT 1
         ) AS thread_fbid,
         (
           SELECT it.last_activity_at
           FROM inbox_threads it
           WHERE it.viewer_id = ?
             AND it.counterparty_user_id = u.user_id
             AND it.thread_subtype = ?
           ORDER BY it.last_activity_at DESC, it.thread_fbid DESC
           LIMIT 1
         ) AS thread_last_activity_at,
         fs.final_dm_score,
         ui.interaction_score
       FROM users u
       LEFT JOIN follow_score fs
         ON fs.follower_id = ? AND fs.following_id = u.user_id
       LEFT JOIN user_interaction_edge ui
         ON ui.viewer_id = ? AND ui.target_user_id = u.user_id
       WHERE u.user_id IN (${placeholders})
         AND u.user_id <> ?
         AND u.is_active = true
         AND u.is_deleted = false
         AND NOT EXISTS (
           SELECT 1
           FROM block_edge b
           WHERE (b.blocker_id = ? AND b.blocked_id = u.user_id)
              OR (b.blocker_id = u.user_id AND b.blocked_id = ?)
         )`,
      [
        viewerId,
        viewerId,
        viewerId,
        ConversationSubtype.ONE_TO_ONE,
        viewerId,
        ConversationSubtype.ONE_TO_ONE,
        viewerId,
        viewerId,
        ...candidateIds,
        viewerId,
        viewerId,
        viewerId,
      ],
    );
  }

  private rank(
    row: HydratedRecipientRow,
    signals: CandidateSignals,
    query: string,
  ): RankedRecipient {
    const username = row.username.toLocaleLowerCase();
    const fullName = row.full_name.toLocaleLowerCase();
    const isFollowing = this.toBoolean(row.is_following);
    const isFollowedBy = this.toBoolean(row.is_followed_by);
    const hasThread = Boolean(row.thread_fbid);

    let lexicalTier = 0;
    if (username === query) lexicalTier = 5;
    else if (username.startsWith(query)) lexicalTier = 4;
    else if (fullName.startsWith(query)) lexicalTier = 3;
    else if (username.includes(query)) lexicalTier = 2;
    else if (fullName.includes(query)) lexicalTier = 1;

    const relationTier = isFollowing
      ? 4
      : hasThread
        ? 3
        : signals.mutualCount > 0
          ? 2
          : isFollowedBy
            ? 1
            : 0;

    return {
      id: String(row.id),
      username: row.username,
      fullName: row.full_name,
      profilePicUrl: row.profile_pic_url,
      isVerified: this.toBoolean(row.is_verified),
      threadFbid: row.thread_fbid ? String(row.thread_fbid) : null,
      lexicalTier,
      relationTier,
      elasticsearchScore: signals.elasticsearchScore,
      mutualCount: signals.mutualCount,
      dmScore: Number(row.final_dm_score ?? 0),
      interactionScore: Number(row.interaction_score ?? 0),
      lastActivityMs: row.thread_last_activity_at
        ? new Date(row.thread_last_activity_at).getTime()
        : 0,
    };
  }

  private ensureCandidate(
    signals: Map<string, CandidateSignals>,
    id: string,
  ): CandidateSignals {
    const key = String(id);
    const existing = signals.get(key);
    if (existing) return existing;
    const value = { elasticsearchScore: 0, mutualCount: 0 };
    signals.set(key, value);
    return value;
  }

  private toBoolean(value: boolean | number | string): boolean {
    return value === true || value === 1 || value === '1';
  }
}
