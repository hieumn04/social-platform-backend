import {
  FollowMutationResult,
  ISocialGraphRepository,
  SOCIAL_GRAPH_REPOSITORY,
} from '../../domain/repositories/social-graph.repository';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class UnfollowUserUseCase {
  constructor(
    @Inject(SOCIAL_GRAPH_REPOSITORY)
    private readonly socialGraphRepository: ISocialGraphRepository,
  ) {}

  async execute(
    actorId: string,
    targetId: string,
  ): Promise<FollowMutationResult> {
    if (actorId === targetId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    const result = await this.socialGraphRepository.unfollow(actorId, targetId);
    if (result.kind === 'TARGET_NOT_FOUND') {
      throw new NotFoundException('Target user was not found');
    }

    return result;
  }
}
