import { LoadFollowSnapshotsByPairsInput } from '@/modules/follow/application/usecase/recomputeFollowScoresByPairs/input';
import { LoadFollowSnapshotsByPairsOutput } from '@/modules/follow/application/usecase/recomputeFollowScoresByPairs/output';
import { FollowsScoreReadRepository } from '@/modules/follow/domain/repositories/folllows-score-read.repository.interface';
import { AppLogger } from '@/shared/logger/applogger';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class LoadFollowSnapshotsByPairsUseCase {
  constructor(
    @Inject('FollowsScoreReadRepository')
    private readonly followsScoreReadRepo: FollowsScoreReadRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LoadFollowSnapshotsByPairsUseCase.name);
  }

  async execute(
    input: LoadFollowSnapshotsByPairsInput,
  ): Promise<LoadFollowSnapshotsByPairsOutput> {
    const { pairs, limit } = input;

    if (!pairs?.length) {
      return { rows: [], total: 0 };
    }

    try {
      const rows = await this.followsScoreReadRepo.findPairsForRecompute(
        limit ? pairs.slice(0, limit) : pairs,
      );

      if (rows.length !== pairs.length) {
        this.logger.warn('snapshot rows mismatch pairs', {
          inputPairs: pairs.length,
          returnedRows: rows.length,
        });
      }

      this.logger.log('load follow snapshots by pairs completed', {
        inputPairs: pairs.length,
        returnedRows: rows.length,
      });

      return {
        rows,
        total: rows.length,
      };
    } catch (error) {
      this.logger.error('LoadFollowSnapshotsByPairsUseCase failed', {
        pairsSize: pairs.length,
        error,
      });
      throw error;
    }
  }
}
