import {
  GetShareSheetRankingInput,
  GetShareSheetRankingUseCase,
  ShareSheetView,
} from '@/modules/share-sheet/application/usecases/get-share-sheet-ranking.usecase';
import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { AccessTokenPayload } from '@/types/token/token.types';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request } from 'express';

interface GraphqlRequestContext {
  req: Request;
}

interface ShareSheetRankingGraphqlInput {
  count_per_page?: number | null;
  is_private_share?: boolean | null;
  views?: ShareSheetView[] | null;
}

@Resolver('Query')
@UseGuards(JwtAuthGuard)
export class ShareSheetResolver {
  constructor(private readonly useCase: GetShareSheetRankingUseCase) {}

  @Query('get_share_sheet_ranking')
  async getShareSheetRanking(
    @Args('input') input: ShareSheetRankingGraphqlInput,
    @Context() context: GraphqlRequestContext,
  ) {
    const viewer = context.req.user as AccessTokenPayload;
    if (!viewer?.sub) throw new UnauthorizedException('Unauthorized');

    const useCaseInput: GetShareSheetRankingInput = {
      countPerPage: input.count_per_page,
      isPrivateShare: input.is_private_share,
      views: input.views,
    };

    return this.useCase.execute(viewer.sub, useCaseInput);
  }
}
