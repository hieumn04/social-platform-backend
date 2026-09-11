import { ShareSheetCandidate } from '@/modules/share-sheet/domain/models/share-sheet-candidate';
import { IShareSheetRankingRepository } from '@/modules/share-sheet/domain/repositories/share-sheet-ranking.repository';
import { ShareSheetRankingDomainService } from '@/modules/share-sheet/domain/services/share-sheet-ranking.domain-service';
import { BadRequestException } from '@nestjs/common';
import {
  GetShareSheetRankingUseCase,
  RESHARE_SHARE_SHEET,
  ShareSheetView,
} from './get-share-sheet-ranking.usecase';

function candidate(
  id: string,
  directConversationCount = 0,
): ShareSheetCandidate {
  return {
    id,
    username: `user_${id}`,
    fullName: `User ${id}`,
    profilePicUrl: null,
    isVerified: false,
    directConversationCount,
    lastDirectAt: directConversationCount
      ? new Date('2026-09-10T00:00:00.000Z')
      : null,
    isFollowing: false,
    isFollowedBy: false,
    followedAt: null,
    affinityScore: 0,
    affinityLastInteractionAt: null,
    lastDmAt: null,
    interactionScore: 0,
    interactionLastAt: null,
  };
}

describe('GetShareSheetRankingUseCase', () => {
  let repository: jest.Mocked<IShareSheetRankingRepository>;
  let useCase: GetShareSheetRankingUseCase;

  beforeEach(() => {
    repository = { findCandidates: jest.fn() };
    useCase = new GetShareSheetRankingUseCase(
      repository,
      new ShareSheetRankingDomainService(),
    );
  });

  it('returns lightweight entities and an authoritative ordered score map', async () => {
    repository.findCandidates.mockResolvedValue([
      candidate('20'),
      candidate('10', 1),
    ]);

    await expect(
      useCase.execute('viewer-1', {
        countPerPage: 1,
        isPrivateShare: true,
        views: [RESHARE_SHARE_SHEET],
      }),
    ).resolves.toEqual({
      entities: {
        user: [
          {
            id: '10',
            username: 'user_10',
            full_name: 'User 10',
            profile_pic_url: null,
            is_verified: false,
          },
        ],
        thread: [],
      },
      ranking: [{ score_map: [{ id: '10' }] }],
    });
    expect(repository.findCandidates).toHaveBeenCalledWith('viewer-1', 100);
  });

  it('returns the stable empty payload when there are no eligible candidates', async () => {
    repository.findCandidates.mockResolvedValue([]);

    await expect(useCase.execute('viewer-1', {})).resolves.toEqual({
      entities: { user: [], thread: [] },
      ranking: [{ score_map: [] }],
    });
  });

  it.each([0, 1.5, 51])(
    'rejects invalid count_per_page value %s before querying',
    async (countPerPage) => {
      await expect(
        useCase.execute('viewer-1', { countPerPage }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findCandidates).not.toHaveBeenCalled();
    },
  );

  it('rejects unsupported views before querying', async () => {
    await expect(
      useCase.execute('viewer-1', {
        views: ['UNSUPPORTED' as ShareSheetView],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findCandidates).not.toHaveBeenCalled();
  });
});
