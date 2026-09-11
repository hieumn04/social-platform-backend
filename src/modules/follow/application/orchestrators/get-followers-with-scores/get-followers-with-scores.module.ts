import { GetFollowersWithScoresUseCase } from '@/modules/follow/application/orchestrators/get-followers-with-scores/get-followers-with-scores.usecase';
import { GetFollowersModule } from '@/modules/follow/application/usecase/getFollowers/get-followers.module';
import { LoadFollowScoresByPairsModule } from '@/modules/follow/application/usecase/recomputeFollowScoresByPairs/load-follow-scores-by-pairs.module';
import { RankingDomainModule } from '@/modules/follow/domain/domain-service/ranking/ranking-domain.module';
import { FindProfileByIdsModule } from '@/modules/users/application/use-cases/find-profiles/find-profiles-by-ids.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    GetFollowersModule,
    FindProfileByIdsModule,
    LoadFollowScoresByPairsModule,
    RankingDomainModule,
    LoggerModule,
  ],
  providers: [GetFollowersWithScoresUseCase],
  exports: [GetFollowersWithScoresUseCase],
})
export class GetFollowersWithScoresModule {}
