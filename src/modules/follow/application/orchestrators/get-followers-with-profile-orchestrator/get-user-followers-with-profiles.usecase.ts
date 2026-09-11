import { GetFollowersInput } from '@/modules/follow/application/usecase/getFollowers/get-followers.input';
import { GetFollowersOrchestratorOutput } from '@/modules/follow/application/usecase/getFollowers/get-followers.output';
import { GetFollowersUseCase } from '@/modules/follow/application/usecase/getFollowers/get-followers.usecase';
import { GetUserProfilesByIdsUseCase } from '@/modules/users/application/use-cases/find-profiles/find-profiles-by-ids.usecase';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GetFollowersOrchestrator {
  constructor(
    private readonly getFollowersUseCase: GetFollowersUseCase,
    private readonly getUserProfilesByIdsUseCase: GetUserProfilesByIdsUseCase,
  ) {}

  async execute(
    input: GetFollowersInput,
  ): Promise<GetFollowersOrchestratorOutput> {
    const result = await this.getFollowersUseCase.execute(input);

    if (!result.candidateIds.length) {
      return {
        rows: [],
        nextCursor: result.nextCursor,
      };
    }

    const profiles = await this.getUserProfilesByIdsUseCase.execute(
      result.candidateIds,
    );

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

    const enrichedRows = result.rows.map((followRow) => ({
      ...followRow,
      profile: profileMap.get(followRow.follower_id) ?? null,
    }));

    return {
      rows: enrichedRows,
      nextCursor: result.nextCursor,
    };
  }
}
