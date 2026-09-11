import { LoadFollowSnapshotsByPairsUseCase } from '@/modules/follow/application/usecase/recomputeFollowScoresByPairs/load-follow-scores-by-pairs.usecase';
import { FollowScorePersistenceModule } from '@/modules/follow/infrastructure/repositories/follows-score-persistence.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [FollowScorePersistenceModule],
  providers: [LoadFollowSnapshotsByPairsUseCase],
  exports: [LoadFollowSnapshotsByPairsUseCase],
})
export class LoadFollowScoresByPairsModule {}
