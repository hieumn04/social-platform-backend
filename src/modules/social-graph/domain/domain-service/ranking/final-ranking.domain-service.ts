import {
  DEFAULT_CONFIG,
  RankingFeatures,
  RankingRow,
} from '@/modules/follow/domain/domain-service/ranking/ranking-feature-builder.domain-service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FinalRankingDomainService {
  private readonly logger = new Logger(FinalRankingDomainService.name);
  private readonly DEBUG = false;

  computeFinalScore(
    features: RankingFeatures,
    row: RankingRow,
    id?: string,
  ): number {
    if (row.isRestricted) return 0;

    const { weight } = DEFAULT_CONFIG;

    // ================= POSITIVE =================

    const positive =
      features.relationship * weight.relationship +
      features.affinity * weight.affinity +
      features.graph * weight.graph +
      features.diversity * weight.diversity;

    // ================= RECENCY MODULATOR =================
    // 60% base stability + 40% recency impact
    const recencyMultiplier = 0.6 + features.recency * 0.4;

    const positiveAfterRecency = positive * recencyMultiplier;

    // ================= NEGATIVE =================

    const negativeImpact = features.negative * weight.negative;

    const finalScore = positiveAfterRecency - negativeImpact;

    if (this.DEBUG && id) {
      this.logger.debug(`
RANK DEBUG -> ${id}
positive: ${positive.toFixed(4)}
recencyMultiplier: ${recencyMultiplier.toFixed(4)}
positiveAfterRecency: ${positiveAfterRecency.toFixed(4)}
negativeImpact: ${negativeImpact.toFixed(4)}
finalScore: ${finalScore.toFixed(4)}
`);
    }

    return finalScore;
  }

  rank<T extends { features: RankingFeatures; row: RankingRow; id?: string }>(
    items: T[],
  ): T[] {
    return items
      .map((item) => ({
        ...item,
        finalScore: this.computeFinalScore(item.features, item.row, item.id),
      }))
      .sort((a, b) => b.finalScore - a.finalScore);
  }
}
