import {
  FriendshipStatusSnapshot,
  ISocialGraphRepository,
  SOCIAL_GRAPH_REPOSITORY,
} from '../../domain/repositories/social-graph.repository';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class GetFriendshipStatusUseCase {
  constructor(
    @Inject(SOCIAL_GRAPH_REPOSITORY)
    private readonly socialGraphRepository: ISocialGraphRepository,
  ) {}

  async execute(
    viewerId: string,
    targetId: string,
  ): Promise<FriendshipStatusSnapshot> {
    const status = await this.socialGraphRepository.getFriendshipStatus(
      viewerId,
      targetId,
    );
    if (!status) throw new NotFoundException('Target user was not found');

    return status;
  }
}
