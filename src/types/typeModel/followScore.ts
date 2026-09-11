export interface RawFollowScoreRow {
  follower_id: string;
  following_id: string;

  like_count: number;
  comment_count: number;
  dm_count: number;
  story_view_count: number;
  profile_click_count: number;

  interaction_score: number;
  dm_score: number;
  story_score: number;
  profile_click_score: number;
  recency_score: number;
  ml_score: number;

  last_event_at: Date | null;
  last_interaction_at: Date | null;
  last_dm_at: Date | null;
  last_story_view_at: Date | null;
  last_profile_click_at: Date | null;
}

export interface RawRankRow {
  follower_id: string;
  following_id: string;
  score: number;
}
