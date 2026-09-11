import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

@Entity('follow_score')
@Index('idx_follow_score_follower', ['followerId'])
@Index('idx_follow_score_following', ['followingId'])
@Index('idx_follow_score_feed_rank', ['followerId', 'finalFeedScore'])
@Index('idx_follow_score_story_rank', ['followerId', 'finalStoryScore'])
@Index('idx_follow_score_dm_rank', ['followerId', 'finalDmScore'])
@Index('idx_follow_score_suggestion_rank', [
  'followerId',
  'finalSuggestionScore',
])
@Index('idx_follow_score_last_interaction', ['followerId', 'lastInteractionAt'])
@Index('idx_follow_score_last_event', ['lastEventAt'])
export class FollowScoreEntity {
  @PrimaryColumn({
    type: 'bigint',
    name: 'follower_id',
    comment: 'Follower user id',
  })
  followerId!: string;

  @PrimaryColumn({
    type: 'bigint',
    name: 'following_id',
    comment: 'Following user id',
  })
  followingId!: string;

  // ===== RAW BEHAVIOR COUNTS =====

  @Column({ type: 'int', default: 0, name: 'like_count' })
  likeCount!: number;

  @Column({ type: 'int', default: 0, name: 'comment_count' })
  commentCount!: number;

  @Column({ type: 'int', default: 0, name: 'dm_count' })
  dmCount!: number;

  @Column({ type: 'int', default: 0, name: 'story_view_count' })
  storyViewCount!: number;

  @Column({ type: 'int', default: 0, name: 'profile_click_count' })
  profileClickCount!: number;

  // ===== HEURISTIC SCORES =====
  // dùng DOUBLE để tránh precision loss khi ranking

  @Column({ type: 'double', default: 0, name: 'interaction_score' })
  interactionScore!: number;

  @Column({ type: 'double', default: 0, name: 'dm_score' })
  dmScore!: number;

  @Column({ type: 'double', default: 0, name: 'story_score' })
  storyScore!: number;

  @Column({ type: 'double', default: 0, name: 'profile_click_score' })
  profileClickScore!: number;

  @Column({ type: 'double', default: 0, name: 'recency_score' })
  recencyScore!: number;

  // ===== MACHINE LEARNING SCORE =====

  @Column({ type: 'double', default: 0, name: 'ml_score' })
  mlScore!: number;

  // ===== LAST EVENTS =====

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_event_at',
  })
  lastEventAt!: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_interaction_at',
  })
  lastInteractionAt!: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_dm_at',
  })
  lastDmAt!: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_story_view_at',
  })
  lastStoryViewAt!: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_profile_click_at',
  })
  lastProfileClickAt!: Date | null;

  // ===== FINAL RANKING OUTPUT =====

  @Column({ type: 'double', default: 0, name: 'final_feed_score' })
  finalFeedScore!: number;

  @Column({ type: 'double', default: 0, name: 'final_story_score' })
  finalStoryScore!: number;

  @Column({ type: 'double', default: 0, name: 'final_dm_score' })
  finalDmScore!: number;

  @Column({ type: 'double', default: 0, name: 'final_suggestion_score' })
  finalSuggestionScore!: number;

  // ===== AFFINITY LEVEL =====

  @Column({
    type: 'smallint',
    default: 0,
    name: 'affinity_level',
    comment: '0=LOW,1=MEDIUM,2=HIGH,3=CLOSE',
  })
  affinityLevel!: number;

  // ===== WORKER SUPPORT =====
  // dùng để đánh dấu row cần recompute score

  @Column({
    type: 'boolean',
    default: false,
    name: 'dirty_flag',
    comment:
      'Marked true when new interaction arrives, worker will recompute score',
  })
  dirtyFlag!: boolean;

  // ===== VERSION + TIMESTAMP =====

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updatedAt!: Date;

  @Column({
    type: 'int',
    default: 0,
    name: 'version',
    comment: 'Optimistic locking for async worker updates',
  })
  version!: number;
}
