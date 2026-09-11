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
export class AcceptFollowRequestUseCase {
  constructor(
    @Inject(SOCIAL_GRAPH_REPOSITORY)
    private readonly socialGraphRepository: ISocialGraphRepository,
  ) {}

  async execute(
    receiverId: string,
    senderId: string,
  ): Promise<FollowMutationResult> {
    if (receiverId === senderId) {
      throw new BadRequestException(
        'You cannot accept your own follow request',
      );
    }

    const result = await this.socialGraphRepository.acceptFollowRequest(
      receiverId,
      senderId,
    );
    if (
      result.kind === 'TARGET_NOT_FOUND' ||
      result.kind === 'REQUEST_NOT_FOUND'
    ) {
      throw new NotFoundException('Pending follow request was not found');
    }
    if (result.kind === 'FOLLOW_FORBIDDEN') {
      throw new ForbiddenException('This follow request cannot be accepted');
    }

    return result;
  }
}
