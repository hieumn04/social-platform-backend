import { Injectable } from '@nestjs/common';

/**
 * =====================================================
 * INPUT SHAPE
 * =====================================================
 */
export interface RankingRow {
  followerId?: string;
  interactionRank?: number;

  dmScore?: number;
  storyViewScore?: number;
  profileViewScore?: number;
  likeScore?: number;

  uniqueInteractionDays?: number;
  bidirectionalInteraction?: boolean;
  conversationDepth?: number;

  lastInteractionAt?: Date;
  createdAt?: Date;
  acceptedAt?: Date;

  mutual?: boolean;
  isBestie?: boolean;
  isFeedFavorite?: boolean;

  mutedStory?: boolean;
  mutedPost?: boolean;
  isRestricted?: boolean;
}

/**
 * =====================================================
 * FEATURE OUTPUT
 * =====================================================
 */
export interface RankingFeatures {
  relationship: number; // [0,1]
  graph: number; // [0,1]
  affinity: number; // [0,1]
  recency: number; // [0,1]
  diversity: number; // [0,1]
  negative: number; // [0, 1]
}

/**
 * =====================================================
 * CONFIG
 * =====================================================
 */
export interface RankingFeatureConfig {
  weight: {
    relationship: number;
    graph: number;
    affinity: number;
    diversity: number;
    negative: number;
  };

  affinityWeight: {
    dm: number;
    story: number;
    profile: number;
    like: number;
  };

  cap: {
    interactionRank: number;
    dm: number;
    story: number;
    profile: number;
    like: number;
    diversityDays: number;
    conversationDepth: number;
  };

  bonus: {
    bestie: number;
    feedFavorite: number;
    mutual: number;
    bidirectional: number;
  };

  penalty: {
    mutedStory: number;
    mutedPost: number;
  };

  halfLife: {
    recencyDays: number;
  };
}

export const DEFAULT_CONFIG: RankingFeatureConfig = {
  weight: {
    relationship: 2.2,
    graph: 1.3,
    affinity: 3.2,
    diversity: 1.4,
    negative: 3.0,
  },

  affinityWeight: {
    dm: 0.45,
    story: 0.25,
    profile: 0.2,
    like: 0.1,
  },

  cap: {
    interactionRank: 1000,
    dm: 500,
    story: 300,
    profile: 200,
    like: 500,
    diversityDays: 120,
    conversationDepth: 200,
  },

  bonus: {
    bestie: 0.08,
    feedFavorite: 0.05,
    mutual: 0.12,
    bidirectional: 0.12,
  },

  penalty: {
    mutedStory: 0.5,
    mutedPost: 0.5,
  },

  halfLife: {
    recencyDays: 10,
  },
};

@Injectable()
export class RankingFeatureBuilderDomainService {
  buildFeatures(row: RankingRow, now = Date.now()): RankingFeatures {
    return {
      relationship: this.relationshipScore(row),
      graph: this.graphScore(row),
      affinity: this.affinityScore(row),
      recency: this.recencyScore(row, now),
      diversity: this.diversityScore(row),
      negative: this.negativeScore(row),
    };
  }

  private relationshipScore(row: RankingRow): number {
    const base = this.logCapNormalized(
      row.interactionRank,
      DEFAULT_CONFIG.cap.interactionRank,
    );

    let score = base;
    if (row.isBestie) {
      score += DEFAULT_CONFIG.bonus.bestie * (1 - base);
    }

    if (row.isFeedFavorite) {
      score += DEFAULT_CONFIG.bonus.feedFavorite * (1 - base);
    }

    return this.clamp(score);
  }

  private graphScore(row: RankingRow): number {
    let score = 0;

    if (row.mutual) {
      score += DEFAULT_CONFIG.bonus.mutual;
    }

    if (row.bidirectionalInteraction) {
      score += DEFAULT_CONFIG.bonus.bidirectional;
    }

    return this.clamp(score);
  }

  private affinityScore(row: RankingRow): number {
    const { cap, affinityWeight } = DEFAULT_CONFIG;

    const dm = this.logCapNormalized(row.dmScore, cap.dm);
    const story = this.logCapNormalized(row.storyViewScore, cap.story);
    const profile = this.logCapNormalized(row.profileViewScore, cap.profile);
    const like = this.logCapNormalized(row.likeScore, cap.like);

    const weighted =
      dm * affinityWeight.dm +
      story * affinityWeight.story +
      profile * affinityWeight.profile +
      like * affinityWeight.like;

    const totalWeight =
      affinityWeight.dm +
      affinityWeight.story +
      affinityWeight.profile +
      affinityWeight.like;

    return this.clamp(weighted / totalWeight);
  }

  private recencyScore(row: RankingRow, now: number): number {
    const baseDate = row.lastInteractionAt ?? row.createdAt;
    if (!baseDate) return 0;

    const days = (now - baseDate.getTime()) / 86400000;
    const halfLife = DEFAULT_CONFIG.halfLife.recencyDays;

    const score = Math.exp((-Math.log(2) * days) / halfLife);

    return this.clamp(score);
  }

  private diversityScore(row: RankingRow): number {
    const days = this.logCapNormalized(
      row.uniqueInteractionDays,
      DEFAULT_CONFIG.cap.diversityDays,
    );

    const depth = this.logCapNormalized(
      row.conversationDepth,
      DEFAULT_CONFIG.cap.conversationDepth,
    );

    return this.clamp((days + depth) / 2);
  }

  private negativeScore(row: RankingRow): number {
    let score = 0;

    if (row.mutedStory) {
      score += DEFAULT_CONFIG.penalty.mutedStory;
    }

    if (row.mutedPost) {
      score += DEFAULT_CONFIG.penalty.mutedPost;
    }

    return this.clamp(score); // [0,1]
  }

  private logCapNormalized(v?: number, cap = 1000): number {
    if (!v || v <= 0) return 0;
    const value = Math.min(v, cap);
    return Math.log1p(value) / Math.log1p(cap);
  }

  private clamp(v: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, v));
  }
}
