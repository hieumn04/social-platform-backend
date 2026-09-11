export type InteractionType =
  | 'LIKE'
  | 'COMMENT'
  | 'DM'
  | 'STORY_VIEW'
  | 'PROFILE_VIEW'
  | 'FOLLOW_ACCEPT';

export interface InteractionEvent {
  type: InteractionType;
  value?: number;
  createdAt: Date;
}
