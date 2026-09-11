import { Injectable, Inject } from '@nestjs/common';
import { IAffinityRepository } from '../../domain/repositories/affinity.repository';

@Injectable()
export class RecomputeFollowScoreUseCase {
  constructor(
    @Inject('IAffinityRepository')
    private readonly repository: IAffinityRepository
  ) {}

  async execute(viewerId: string, targetUserId: string): Promise<void> {
    const score = await this.repository.getScore(viewerId, targetUserId);
    if (!score) return; // or initialize

    // Assuming we recalculate based on some factors here (e.g. recent interactions)
    // for this example, we just clear the dirty flag and adjust the score slightly

    const newInteractionScore = score.interactionScore; // Fetch from interaction aggregations
    const newFollowScore = score.followScore; // Fetch from graph structure
    const newFinalScore = newInteractionScore * 0.7 + newFollowScore * 0.3;

    await this.repository.upsertScore({
      viewerId,
      targetUserId,
      interactionScore: newInteractionScore,
      followScore: newFollowScore,
      finalScore: newFinalScore,
      dirtyFlag: false
    });
  }
}
