import { ShareSheetCandidate } from '@/modules/share-sheet/domain/models/share-sheet-candidate';

export interface RankedShareSheetCandidate {
  candidate: ShareSheetCandidate;
  score: number;
}

export class ShareSheetRankingDomainService {
  rank(
    candidates: ShareSheetCandidate[],
    now = Date.now(),
  ): RankedShareSheetCandidate[] {
    return candidates
      .map((candidate) => ({
        candidate,
        score: this.computeScore(candidate, now),
      }))
      .sort((left, right) => {
        const scoreDifference = right.score - left.score;
        if (scoreDifference !== 0) return scoreDifference;

        const activityDifference =
          this.latestActivityAt(right.candidate) -
          this.latestActivityAt(left.candidate);
        if (activityDifference !== 0) return activityDifference;

        return this.compareIdsDescending(left.candidate.id, right.candidate.id);
      });
  }

  private computeScore(candidate: ShareSheetCandidate, now: number): number {
    let score = 0;

    if (candidate.directConversationCount > 0) {
      score += 100;
      score += Math.min(20, candidate.directConversationCount * 4);
      score += this.recencyBoost(candidate.lastDirectAt, 60, 14, now);
    }

    if (candidate.isFollowing) score += 30;
    if (candidate.isFollowedBy) score += 15;
    if (candidate.isFollowing && candidate.isFollowedBy) score += 15;

    score += this.logarithmicBoost(candidate.affinityScore, 40, 6);
    score += this.logarithmicBoost(candidate.interactionScore, 25, 4);

    const latestNonDirectInteraction = this.maxDate(
      candidate.lastDmAt,
      candidate.affinityLastInteractionAt,
      candidate.interactionLastAt,
      candidate.followedAt,
    );
    score += this.recencyBoost(latestNonDirectInteraction, 20, 30, now);

    return score;
  }

  private logarithmicBoost(
    value: number,
    maximum: number,
    multiplier: number,
  ): number {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.min(maximum, Math.log1p(value) * multiplier);
  }

  private recencyBoost(
    date: Date | null,
    maximum: number,
    halfLifeDays: number,
    now: number,
  ): number {
    if (!date) return 0;

    const ageDays = Math.max(0, now - date.getTime()) / 86_400_000;
    return maximum * Math.exp((-Math.log(2) * ageDays) / halfLifeDays);
  }

  private latestActivityAt(candidate: ShareSheetCandidate): number {
    return (
      this.maxDate(
        candidate.lastDirectAt,
        candidate.lastDmAt,
        candidate.affinityLastInteractionAt,
        candidate.interactionLastAt,
        candidate.followedAt,
      )?.getTime() ?? 0
    );
  }

  private maxDate(...dates: Array<Date | null>): Date | null {
    let latest: Date | null = null;

    for (const date of dates) {
      if (date && (!latest || date.getTime() > latest.getTime())) {
        latest = date;
      }
    }

    return latest;
  }

  private compareIdsDescending(left: string, right: string): number {
    try {
      const leftId = BigInt(left);
      const rightId = BigInt(right);
      if (leftId === rightId) return 0;
      return leftId > rightId ? -1 : 1;
    } catch {
      return right.localeCompare(left);
    }
  }
}
