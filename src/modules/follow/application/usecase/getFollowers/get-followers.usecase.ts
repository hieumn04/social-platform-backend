import { Inject, Injectable } from '@nestjs/common';
import { GetFollowersInput } from '@/modules/follow/application/usecase/getFollowers/get-followers.input';
import { GetFollowersOutput } from '@/modules/follow/application/usecase/getFollowers/get-followers.output';

import { FollowsReadRepository } from '@/modules/follow/domain/repositories/follows.repository.interface';

@Injectable()
export class GetFollowersUseCase {
  constructor(
    @Inject('FollowsReadRepository')
    private readonly followsRepo: FollowsReadRepository,
  ) {}

  async execute(input: GetFollowersInput): Promise<GetFollowersOutput> {
    const { viewerId, targetUserId, limit = 50, cursor } = input;

    const { rows, nextCursor } = await this.followsRepo.findFollowersCandidates(
      targetUserId,
      limit,
      cursor,
    );

    if (!rows.length) {
      return { rows: [], nextCursor: null, candidateIds: [] };
    }

    const candidateIds = rows.map((r) => r.follower_id);

    return {
      rows: rows,
      nextCursor,
      candidateIds,
    };
  }
}
