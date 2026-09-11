import {
  InstagramFollowerResponse,
  InstagramFollowersListResponse,
} from '@/modules/follow/application/orchestrators/get-followers-with-scores/get-followers-with-profile.output';
import { GetFollowersInput } from '@/modules/follow/application/usecase/getFollowers/get-followers.input';
import { GetFollowersUseCase } from '@/modules/follow/application/usecase/getFollowers/get-followers.usecase';
import { LoadFollowSnapshotsByPairsUseCase } from '@/modules/follow/application/usecase/recomputeFollowScoresByPairs/load-follow-scores-by-pairs.usecase';
import { FinalRankingDomainService } from '@/modules/follow/domain/domain-service/ranking/final-ranking.domain-service';
import { RankingFeatureBuilderDomainService } from '@/modules/follow/domain/domain-service/ranking/ranking-feature-builder.domain-service';
import { RankingRowMapper } from '@/modules/follow/infrastructure/mapper/follow-ranking.mapper';
import { InstagramFollowersResponseMapper } from '@/modules/follow/infrastructure/mapper/instagram-followers.response.mapper';
import { GetUserProfilesByIdsUseCase } from '@/modules/users/application/use-cases/find-profiles/find-profiles-by-ids.usecase';
import { AppLogger } from '@/shared/logger/applogger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GetFollowersWithScoresUseCase {
  constructor(
    private readonly getFollowersUseCase: GetFollowersUseCase,
    private readonly loadFollowSnapshotsByPairsUseCase: LoadFollowSnapshotsByPairsUseCase,
    private readonly getUserProfilesByIdsUseCase: GetUserProfilesByIdsUseCase,
    private readonly featureBuilder: RankingFeatureBuilderDomainService,
    private readonly finalRanking: FinalRankingDomainService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetFollowersWithScoresUseCase.name);
  }

  async execute(
    input: GetFollowersInput,
  ): Promise<InstagramFollowersListResponse> {
    const { viewerId, targetUserId } = input;

    // ================= STEP 1 — Load follower candidates =================
    const followersResult = await this.getFollowersUseCase.execute(input);

    if (!followersResult.rows.length) {
      return {
        users: [],
        next_cursor: null,
        has_more: false,
        status: 'ok',
      };
    }

    // ================= STEP 2 — Build follow pairs =================
    const pairs = followersResult.rows.map((row) => ({
      followerId: row.follower_id,
      followingId: targetUserId,
    }));

    // ================= STEP 3 — Load interaction snapshots =================
    const snapshotResult = await this.loadFollowSnapshotsByPairsUseCase.execute(
      { pairs },
    );

    const snapshotMap = new Map(
      snapshotResult.rows.map((s) => [s.follower_id, s]),
    );

    // ================= STEP 4 — Map to RankingRow =================
    const rankingRows = RankingRowMapper.toDomains(
      followersResult.rows,
      snapshotMap,
    );

    // ================= STEP 5 — Compute ranking safely =================
    const rankedItems = rankingRows
      .filter((row) => !!row.followerId)
      .map((row) => {
        const features = this.featureBuilder.buildFeatures(row);

        const finalScore = this.finalRanking.computeFinalScore(
          features,
          row,
          row.followerId,
        );

        return {
          row,
          finalScore,
        };
      });

    // ================= STEP 6 — Sort by score =================
    rankedItems.sort((a, b) => b.finalScore - a.finalScore);

    const sortedRankingRows = rankedItems.map((r) => r.row);
    const sortedFollowerIds = sortedRankingRows.map(
      (r) => r.followerId as string,
    );

    // ================= STEP 7 — Load profiles AFTER ranking =================
    const profiles =
      await this.getUserProfilesByIdsUseCase.execute(sortedFollowerIds);

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

    // ================= STEP 8 — Map to Instagram DTO =================
    const users: InstagramFollowerResponse[] = [];

    for (const rankingRow of sortedRankingRows) {
      const followerId = rankingRow.followerId;
      if (!followerId) continue;

      const profile = profileMap.get(followerId);

      if (!profile) {
        this.logger.warn('Profile missing for follower', {
          followerId,
        });
        continue;
      }

      users.push(
        InstagramFollowersResponseMapper.toResponse(profile, rankingRow),
      );
    }

    this.logger.log('Followers ranking completed', {
      viewerId,
      targetUserId,
      totalCandidates: followersResult.rows.length,
      returnedUsers: users.length,
      hasMore: followersResult.nextCursor !== null,
    });

    return {
      users,
      next_cursor: followersResult.nextCursor,
      has_more: followersResult.nextCursor !== null,
      status: 'ok',
    };
  }
}
