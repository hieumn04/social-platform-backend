import {
  IShareSheetRankingRepository,
  SHARE_SHEET_RANKING_REPOSITORY,
} from '@/modules/share-sheet/domain/repositories/share-sheet-ranking.repository';
import { ShareSheetRankingDomainService } from '@/modules/share-sheet/domain/services/share-sheet-ranking.domain-service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

export const RESHARE_SHARE_SHEET = 'RESHARE_SHARE_SHEET' as const;
export type ShareSheetView = typeof RESHARE_SHARE_SHEET;

export interface GetShareSheetRankingInput {
  countPerPage?: number | null;
  isPrivateShare?: boolean | null;
  views?: ShareSheetView[] | null;
}

export interface GetShareSheetRankingResult {
  entities: {
    user: Array<{
      id: string;
      username: string;
      full_name: string;
      profile_pic_url: string | null;
      is_verified: boolean;
    }>;
    thread: never[];
  };
  ranking: Array<{
    score_map: Array<{ id: string }>;
  }>;
}

@Injectable()
export class GetShareSheetRankingUseCase {
  constructor(
    @Inject(SHARE_SHEET_RANKING_REPOSITORY)
    private readonly repository: IShareSheetRankingRepository,
    private readonly rankingService: ShareSheetRankingDomainService,
  ) {}

  async execute(
    viewerId: string,
    input: GetShareSheetRankingInput,
  ): Promise<GetShareSheetRankingResult> {
    const countPerPage = input.countPerPage ?? 20;
    this.validateInput(countPerPage, input.views);

    const poolLimit = Math.min(500, Math.max(100, countPerPage * 5));
    const candidates = await this.repository.findCandidates(
      viewerId,
      poolLimit,
    );
    const recipients = this.rankingService
      .rank(candidates)
      .slice(0, countPerPage)
      .map(({ candidate }) => candidate);

    return {
      entities: {
        user: recipients.map((recipient) => ({
          id: recipient.id,
          username: recipient.username,
          full_name: recipient.fullName,
          profile_pic_url: recipient.profilePicUrl,
          is_verified: recipient.isVerified,
        })),
        thread: [],
      },
      ranking: [
        {
          score_map: recipients.map((recipient) => ({ id: recipient.id })),
        },
      ],
    };
  }

  private validateInput(
    countPerPage: number,
    views: ShareSheetView[] | null | undefined,
  ): void {
    if (
      !Number.isInteger(countPerPage) ||
      countPerPage < 1 ||
      countPerPage > 50
    ) {
      throw new BadRequestException(
        'count_per_page must be an integer between 1 and 50',
      );
    }

    if (views?.some((view) => view !== RESHARE_SHARE_SHEET)) {
      throw new BadRequestException('Unsupported share sheet view');
    }
  }
}
