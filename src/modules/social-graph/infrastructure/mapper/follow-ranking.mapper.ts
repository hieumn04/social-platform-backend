import { RankingRow } from '@/modules/follow/domain/domain-service/ranking/ranking-feature-builder.domain-service';
import { FollowersCandidateRow } from '@/types/typeModel/follows';
import { RawFollowScoreRow } from '@/types/typeModel/followScore';

export class RankingRowMapper {
  static toDomain(
    row: FollowersCandidateRow,
    snapshot?: RawFollowScoreRow,
  ): RankingRow {
    return {
      /**
       * ===== Interaction ranking signals =====
       * DB snapshot → domain
       */
      followerId: row.follower_id,
      interactionRank: snapshot?.interaction_score ?? undefined,

      dmScore: snapshot?.dm_score ?? undefined,
      storyViewScore: snapshot?.story_score ?? undefined,
      profileViewScore: snapshot?.profile_click_score ?? undefined,
      likeScore: snapshot?.like_count ?? undefined,

      /**
       * ===== Diversity signals =====
       * Hiện DB chưa có → để undefined
       */
      uniqueInteractionDays: undefined,
      bidirectionalInteraction: undefined,
      conversationDepth: undefined,

      /**
       * ===== Time signals =====
       */
      lastInteractionAt: snapshot?.last_interaction_at ?? undefined,

      createdAt: row.created_at ? new Date(row.created_at) : undefined,

      acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,

      /**
       * ===== Relationship flags =====
       */

      isBestie: row.is_bestie ?? undefined,
      isFeedFavorite: row.is_feed_favorite ?? undefined,

      mutedStory: row.muted_story ?? undefined,
      mutedPost: row.muted_post ?? undefined,
      isRestricted: row.is_restricted ?? undefined,
    };
  }

  static toDomains(
    rows: FollowersCandidateRow[],
    snapshotMap: Map<string, RawFollowScoreRow>,
  ): RankingRow[] {
    return rows.map((r) => this.toDomain(r, snapshotMap.get(r.follower_id)));
  }
}
