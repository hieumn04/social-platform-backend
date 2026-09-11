import { FollowersCandidateRow } from '@/types/typeModel/follows';
import { FollowerCandidate } from '@/types/typeModel/follows';

export class FollowerCandidateMapper {
  static toDomain(
    row: FollowersCandidateRow,
    mutualSet: Set<string>,
  ): FollowerCandidate {
    return {
      followerId: row.follower_id,
      createdAt: new Date(row.created_at),

      mutual: mutualSet.has(row.follower_id),

      // relationship signals
      interactionRank: row.interaction_rank ?? 0,
      lastInteractionAt: row.last_interaction_at
        ? new Date(row.last_interaction_at)
        : undefined,

      acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,

      removedAt: row.removed_at ? new Date(row.removed_at) : undefined,

      isBestie: row.is_bestie,
      isFeedFavorite: row.is_feed_favorite ?? false,

      // negative
      isRestricted: row.is_restricted,
      mutedStory: row.muted_story,
      mutedPost: row.muted_post,

      // dynamic affinity
      dmScore: 0,
      storyViewScore: 0,
      profileViewScore: 0,
      likeScore: 0,
    };
  }
}
