import { GetShareSheetRankingUseCase } from '@/modules/share-sheet/application/usecases/get-share-sheet-ranking.usecase';
import { UnauthorizedException } from '@nestjs/common';
import { ShareSheetResolver } from './share-sheet.resolver';

describe('ShareSheetResolver', () => {
  const execute = jest.fn();
  const resolver = new ShareSheetResolver({
    execute,
  } as unknown as GetShareSheetRankingUseCase);

  beforeEach(() => jest.clearAllMocks());

  it('takes viewer identity from JWT context and maps GraphQL input', async () => {
    execute.mockResolvedValue({
      entities: { user: [], thread: [] },
      ranking: [{ score_map: [] }],
    });

    await resolver.getShareSheetRanking(
      {
        count_per_page: 20,
        is_private_share: false,
        views: ['RESHARE_SHARE_SHEET'],
      },
      {
        req: {
          user: { sub: '329733419191767040' },
        },
      } as never,
    );

    expect(execute).toHaveBeenCalledWith('329733419191767040', {
      countPerPage: 20,
      isPrivateShare: false,
      views: ['RESHARE_SHARE_SHEET'],
    });
  });

  it('rejects a request without an authenticated viewer', async () => {
    await expect(
      resolver.getShareSheetRanking({}, { req: {} } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(execute).not.toHaveBeenCalled();
  });
});
