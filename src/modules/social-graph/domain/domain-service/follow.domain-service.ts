import { FollowerCandidate, RankedFollower } from '@/types/typeModel/follows';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FollowersRankingDomainService {
  // ======================================================
  // CONFIG WEIGHTS — dễ tuning production
  // ======================================================

  private readonly WEIGHTS = {
    RELATIONSHIP: 0.7,
    GRAPH: 0.3,
    AFFINITY: 0.4,
  };

  // ======================================================
  // ENTRY POINT
  // ======================================================

  rank(viewerId: string, candidates: FollowerCandidate[]): RankedFollower[] {
    const now = Date.now();

    return (
      candidates
        // HARD FILTER
        .filter((c) => !c.removedAt)
        .map((c) => {
          const { score, features } = this.computeScore(viewerId, c, now);
          return {
            ...c,
            score,
            features, // debug / analytics / tuning
          };
        })
        .sort((a, b) => b.score - a.score)
    );
  }

  // ======================================================
  // CORE SCORING PIPELINE
  // ======================================================

  private computeScore(
    viewerId: string,
    c: FollowerCandidate,
    now: number,
  ): {
    score: number;
    features: {
      relationship: number;
      graph: number;
      affinity: number;
    };
  } {
    // relationship strength
    const relationship = this.relationshipScore(c, now);

    // follow graph topology
    const graph = this.followGraphScore(c, now);

    // dynamic affinity
    const affinity = this.viewerAffinityScore(c);

    // weighted blend
    let score =
      relationship * this.WEIGHTS.RELATIONSHIP +
      graph * this.WEIGHTS.GRAPH +
      affinity * this.WEIGHTS.AFFINITY;

    // negative override
    score += this.negativeScore(c);

    // clamp anti-noise / anti-exploit
    score = this.clamp(score, -200, 300);

    return {
      score,
      features: {
        relationship,
        graph,
        affinity,
      },
    };
  }

  // ======================================================
  // (A) RELATIONSHIP STRENGTH
  // ======================================================

  private relationshipScore(c: FollowerCandidate, now: number): number {
    let score = 0;

    // interaction normalization
    score += this.normalizeInteraction(c.interactionRank);

    // recency ưu tiên interaction → fallback follow recency
    if (c.lastInteractionAt) {
      score += this.recencyDecay(c.lastInteractionAt, 25, now);
    } else if (c.createdAt) {
      score += this.recencyDecay(c.createdAt, 10, now);
    }

    if (c.isBestie) score += 60;
    if (c.isFeedFavorite) score += 30;

    return score;
  }

  private normalizeInteraction(rank?: number): number {
    if (!rank || rank <= 0) return 0;

    // chống data bẩn phá ranking
    const safeRank = Math.min(rank, 1000);

    return Math.log1p(safeRank) * 12;
  }

  // ======================================================
  // (B) FOLLOW GRAPH SIGNAL
  // ======================================================

  private followGraphScore(c: FollowerCandidate, now: number): number {
    let score = 0;

    if (c.mutual) score += 35;

    // longevity relationship
    if (c.acceptedAt) {
      score += this.longevityBoost(c.acceptedAt, 20, now);
    }

    return score;
  }

  // ======================================================
  // (C) VIEWER AFFINITY (dynamic)
  // ======================================================

  private viewerAffinityScore(c: FollowerCandidate): number {
    let score = 0;

    // nonlinear scaling → chống spam
    score += this.scale(c.dmScore, 40);
    score += this.scale(c.storyViewScore, 20);
    score += this.scale(c.profileViewScore, 12);
    score += this.scale(c.likeScore, 10);

    return score;
  }

  private scale(value?: number, weight = 1): number {
    if (!value || value <= 0) return 0;
    return Math.log1p(value) * weight;
  }

  // ======================================================
  // (D) NEGATIVE SIGNALS
  // ======================================================

  private negativeScore(c: FollowerCandidate): number {
    // restricted → gần như drop khỏi ranking
    if (c.isRestricted) return -200;

    let score = 0;

    if (c.mutedStory) score -= 25;
    if (c.mutedPost) score -= 25;

    return score;
  }

  // ======================================================
  // UTILITIES
  // ======================================================

  private recencyDecay(date: Date, maxScore: number, now: number): number {
    const diffDays = (now - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) return maxScore;
    if (diffDays <= 7) return maxScore * 0.7;
    if (diffDays <= 30) return maxScore * 0.4;
    if (diffDays <= 90) return maxScore * 0.2;

    return 0;
  }

  private longevityBoost(date: Date, maxScore: number, now: number): number {
    const diffYears = (now - date.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (diffYears >= 3) return maxScore;
    if (diffYears >= 1) return maxScore * 0.6;

    return maxScore * 0.3;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
