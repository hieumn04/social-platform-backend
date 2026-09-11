import { DataSource } from 'typeorm';
import { ShareSheetRankingRepositoryImpl } from './share-sheet-ranking.repository.impl';

describe('ShareSheetRankingRepositoryImpl', () => {
  it('loads all ranking signals in one query and maps database values', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id: '329734922971385856',
        username: 'zhouye11',
        full_name: 'Zhou Ye',
        profile_pic_url: 'https://cdn.example/avatar.jpg',
        is_verified: 1,
        direct_conversation_count: '2',
        last_direct_at: '2026-09-10T00:00:00.000Z',
        is_following: '1',
        is_followed_by: 0,
        followed_at: '2026-09-01T00:00:00.000Z',
        affinity_score: '12.5',
        affinity_last_interaction_at: null,
        last_dm_at: '2026-09-10T00:00:00.000Z',
        interaction_score: '3',
        interaction_last_at: null,
      },
    ]);
    const repository = new ShareSheetRankingRepositoryImpl({
      query,
    } as unknown as DataSource);

    await expect(repository.findCandidates('viewer-1', 900)).resolves.toEqual([
      {
        id: '329734922971385856',
        username: 'zhouye11',
        fullName: 'Zhou Ye',
        profilePicUrl: 'https://cdn.example/avatar.jpg',
        isVerified: true,
        directConversationCount: 2,
        lastDirectAt: new Date('2026-09-10T00:00:00.000Z'),
        isFollowing: true,
        isFollowedBy: false,
        followedAt: new Date('2026-09-01T00:00:00.000Z'),
        affinityScore: 12.5,
        affinityLastInteractionAt: null,
        lastDmAt: new Date('2026-09-10T00:00:00.000Z'),
        interactionScore: 3,
        interactionLastAt: null,
      },
    ]);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('conversation_participants');
    expect(sql).toContain('follow_score');
    expect(sql).toContain('user_interaction_edge');
    expect(sql).toContain('block_edge');
    expect(parameters).toEqual([
      'viewer-1',
      'viewer-1',
      'viewer-1',
      'viewer-1',
      'viewer-1',
      'viewer-1',
      'viewer-1',
      'viewer-1',
      500,
    ]);
  });
});
