import {
  createEmptyInteractionAggregate,
  InteractionAggregate,
} from '@/modules/follow/domain/domain-service/interaction/interaction-aggregate';
import {
  InteractionEvent,
  InteractionType,
} from '@/modules/follow/domain/domain-service/interaction/interaction-event';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InteractionScoreDomainService {
  // =====================================================
  // CONFIG
  // =====================================================

  private readonly EVENT_WEIGHTS: Record<InteractionType, number> = {
    LIKE: 1,
    COMMENT: 2,
    DM: 3,
    STORY_VIEW: 0.5,
    PROFILE_VIEW: 0.7,
    FOLLOW_ACCEPT: 5,
  };

  private readonly HALF_LIFE_DAYS = {
    interactionRank: 14,
    feature: 30,
  };

  private readonly CAP = {
    interactionRank: 2000,
    comment: 1200,
    dm: 1500,
    story: 800,
    profile: 600,
    like: 500,
  };

  // =====================================================
  // MAIN ENTRY (IMMUTABLE)
  // =====================================================

  applyEvent(
    aggregate: InteractionAggregate | null | undefined,
    event: InteractionEvent,
    now = Date.now(),
  ): InteractionAggregate {
    const baseAgg = aggregate ?? createEmptyInteractionAggregate();

    const baseWeight = this.EVENT_WEIGHTS[event.type] ?? 0;
    const value = event.value ?? 1;

    let score = baseWeight * value;

    // anti-spam
    score *= this.spamThrottleFactor(baseAgg, event.type);

    // decay
    const decayed = this.decayAggregate(baseAgg, now);

    // feature accumulation
    const updated = this.applyFeatureScore(decayed, event.type, score);

    // update overall rank
    const interactionRank = Math.min(
      decayed.interactionRank + score,
      this.CAP.interactionRank,
    );

    return {
      ...updated,
      interactionRank,
      lastInteractionAt: event.createdAt,
    };
  }

  // =====================================================
  // FEATURE ACCUMULATION
  // =====================================================

  private applyFeatureScore(
    agg: InteractionAggregate,
    type: InteractionType,
    score: number,
  ): InteractionAggregate {
    switch (type) {
      case 'LIKE':
        return {
          ...agg,
          likeScore: Math.min(agg.likeScore + score, this.CAP.like),
        };

      case 'COMMENT':
        return {
          ...agg,
          commentScore: Math.min(agg.commentScore + score, this.CAP.comment),
        };

      case 'DM':
        return {
          ...agg,
          dmScore: Math.min(agg.dmScore + score, this.CAP.dm),
        };

      case 'STORY_VIEW':
        return {
          ...agg,
          storyViewScore: Math.min(agg.storyViewScore + score, this.CAP.story),
        };

      case 'PROFILE_VIEW':
        return {
          ...agg,
          profileViewScore: Math.min(
            agg.profileViewScore + score,
            this.CAP.profile,
          ),
        };

      default:
        return agg;
    }
  }

  // =====================================================
  // DECAY LOGIC
  // =====================================================

  private decayAggregate(
    agg: InteractionAggregate,
    now: number,
  ): InteractionAggregate {
    if (!agg.lastInteractionAt) return agg;

    const decay = (score: number) =>
      this.decayScore(score, agg.lastInteractionAt!, now);

    return {
      ...agg,
      likeScore: decay(agg.likeScore),
      commentScore: decay(agg.commentScore),
      dmScore: decay(agg.dmScore),
      storyViewScore: decay(agg.storyViewScore),
      profileViewScore: decay(agg.profileViewScore),
      interactionRank: this.decayScore(
        agg.interactionRank,
        agg.lastInteractionAt,
        now,
        this.HALF_LIFE_DAYS.interactionRank,
      ),
    };
  }

  private decayScore(
    score: number,
    lastInteractionAt: Date,
    now: number,
    halfLife = this.HALF_LIFE_DAYS.feature,
  ): number {
    if (!score) return score;

    const days = (now - lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24);
    return score * Math.exp(-days / halfLife);
  }

  // =====================================================
  // SPAM PROTECTION
  // =====================================================

  private spamThrottleFactor(
    agg: InteractionAggregate,
    type: InteractionEvent['type'],
  ): number {
    const signal =
      type === 'COMMENT'
        ? agg.commentScore
        : type === 'DM'
          ? agg.dmScore
          : type === 'STORY_VIEW'
            ? agg.storyViewScore
            : 0;

    if (!signal) return 1;

    return 1 / (1 + signal / 50);
  }
}
