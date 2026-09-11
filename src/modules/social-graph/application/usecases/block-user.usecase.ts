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
export class BlockUserUseCase {
  constructor(
    @Inject(SOCIAL_GRAPH_REPOSITORY)
    private readonly socialGraphRepository: ISocialGraphRepository,
  ) {}

  async execute(
    blockerId: string,
    blockedId: string,
  ): Promise<FollowMutationResult> {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const result = await this.socialGraphRepository.blockUser(
      blockerId,
      blockedId,
    );
    if (result.kind === 'TARGET_NOT_FOUND') {
      throw new NotFoundException('Target user was not found');
    }

    return result;
  }
}
