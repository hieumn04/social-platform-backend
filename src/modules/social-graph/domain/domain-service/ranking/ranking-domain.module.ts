import { FinalRankingDomainService } from '@/modules/follow/domain/domain-service/ranking/final-ranking.domain-service';
import { RankingFeatureBuilderDomainService } from '@/modules/follow/domain/domain-service/ranking/ranking-feature-builder.domain-service';
import { Module } from '@nestjs/common';

@Module({
  providers: [RankingFeatureBuilderDomainService, FinalRankingDomainService],
  exports: [RankingFeatureBuilderDomainService, FinalRankingDomainService],
})
export class RankingDomainModule {}
