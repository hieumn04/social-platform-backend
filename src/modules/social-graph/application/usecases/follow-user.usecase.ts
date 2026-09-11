import {
  FollowMutationResult,
  ISocialGraphRepository,
  SOCIAL_GRAPH_REPOSITORY,
} from '../../domain/repositories/social-graph.repository';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class FollowUserUseCase {
  constructor(
    @Inject(SOCIAL_GRAPH_REPOSITORY)
    private readonly socialGraphRepository: ISocialGraphRepository,
  ) {}

  async execute(
    actorId: string,
    targetId: string,
  ): Promise<FollowMutationResult> {
    if (actorId === targetId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const result = await this.socialGraphRepository.follow(actorId, targetId);

    if (result.kind === 'TARGET_NOT_FOUND') {
      throw new NotFoundException('Target user was not found');
    }
    if (result.kind === 'FOLLOW_FORBIDDEN') {
      throw new ForbiddenException('You cannot follow this user');
    }

    return result;
  }
}
