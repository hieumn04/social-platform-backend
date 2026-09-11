import { ShareSheetCandidate } from '@/modules/share-sheet/domain/models/share-sheet-candidate';
import { ShareSheetRankingDomainService } from './share-sheet-ranking.domain-service';

const NOW = new Date('2026-09-11T00:00:00.000Z').getTime();

function candidate(
  overrides: Partial<ShareSheetCandidate>,
): ShareSheetCandidate {
  return {
    id: '1',
    username: 'candidate',
    fullName: 'Candidate',
    profilePicUrl: null,
    isVerified: false,
    directConversationCount: 0,
    lastDirectAt: null,
    isFollowing: false,
    isFollowedBy: false,
    followedAt: null,
    affinityScore: 0,
    affinityLastInteractionAt: null,
    lastDmAt: null,
    interactionScore: 0,
    interactionLastAt: null,
    ...overrides,
  };
}

describe('ShareSheetRankingDomainService', () => {
  const service = new ShareSheetRankingDomainService();

  it('prioritizes a recent direct recipient over a follow-only candidate', () => {
    const directRecipient = candidate({
      id: '10',
      directConversationCount: 1,
      lastDirectAt: new Date('2026-09-10T00:00:00.000Z'),
    });
    const followedRecipient = candidate({
      id: '20',
      isFollowing: true,
      followedAt: new Date('2026-09-10T00:00:00.000Z'),
    });

    expect(
      service
        .rank([followedRecipient, directRecipient], NOW)
        .map((entry) => entry.candidate.id),
    ).toEqual(['10', '20']);
  });

  it('uses latest activity and then numeric id as deterministic tie breakers', () => {
    const older = candidate({
      id: '100',
      interactionLastAt: new Date('2026-09-01T00:00:00.000Z'),
    });
    const newerSmallerId = candidate({
      id: '200',
      interactionLastAt: new Date('2026-09-10T00:00:00.000Z'),
    });
    const newerLargerId = candidate({
      id: '300',
      interactionLastAt: new Date('2026-09-10T00:00:00.000Z'),
    });

    expect(
      service
        .rank([older, newerSmallerId, newerLargerId], NOW)
        .map((entry) => entry.candidate.id),
    ).toEqual(['300', '200', '100']);
  });
});
