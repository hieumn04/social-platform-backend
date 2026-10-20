import { DataSource } from 'typeorm';

import { UserDirectorySearchService } from '@/shared/search/user-directory-search.service';
import { RecipientSearchRepositoryImpl } from './recipient-search.repository.impl';

describe('RecipientSearchRepositoryImpl', () => {
  it('merges candidate sources and ranks follow, direct, second degree, global', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('CAST(f.following_id AS CHAR)')) return [{ id: '20' }];
      if (sql.includes('CAST(it.counterparty_user_id AS CHAR)')) {
        return [{ id: '30' }];
      }
      if (sql.includes('WITH recent_bridges')) {
        return [{ id: '40', mutual_count: 2 }];
      }
      if (sql.includes('SELECT\n         CAST(u.user_id AS CHAR) AS id')) {
        return [
          recipientRow('50', 'zhou_global'),
          recipientRow('40', 'zhou_mutual'),
          recipientRow('30', 'zhou_dm', { thread_fbid: '1000' }),
          recipientRow('20', 'zhou_follow', { is_following: 1 }),
        ];
      }
      throw new Error(`Unexpected query: ${sql}`);
    });
    const directory = {
      search: jest.fn().mockResolvedValue([{ userId: '50', score: 12 }]),
    } as unknown as UserDirectorySearchService;
    const repository = new RecipientSearchRepositoryImpl(
      { query } as unknown as DataSource,
      directory,
    );

    const result = await repository.search('10', 'zhou', 10);

    expect(result.map((item) => item.id)).toEqual(['20', '30', '40', '50']);
    expect(directory.search).toHaveBeenCalledWith('zhou', 100);
    expect(query).toHaveBeenCalledTimes(4);
    expect(query.mock.calls.at(-1)?.[0]).toContain('block_edge');
    expect(query.mock.calls.at(-1)?.[0]).toContain('counterparty_user_id');
  });

  it('uses only indexed username exact/prefix lookup when Elasticsearch is down', async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.includes('CAST(f.following_id AS CHAR)')) return [];
      if (sql.includes('CAST(it.counterparty_user_id AS CHAR)')) return [];
      if (sql.includes('WITH recent_bridges')) return [];
      if (sql.includes('u.username = ? OR u.username LIKE')) {
        return [{ id: '20' }];
      }
      if (sql.includes('SELECT\n         CAST(u.user_id AS CHAR) AS id')) {
        return [recipientRow('20', 'zhouye11')];
      }
      throw new Error(`Unexpected query: ${sql}`);
    });
    const directory = {
      search: jest.fn().mockResolvedValue(null),
    } as unknown as UserDirectorySearchService;
    const repository = new RecipientSearchRepositoryImpl(
      { query } as unknown as DataSource,
      directory,
    );

    await expect(repository.search('10', 'zhou', 10)).resolves.toHaveLength(1);
    const fallbackSql = query.mock.calls[3][0] as string;
    expect(fallbackSql).not.toContain("CONCAT('%', ?, '%')");
  });
});

function recipientRow(
  id: string,
  username: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    username,
    full_name: username,
    profile_pic_url: null,
    is_verified: 0,
    is_following: 0,
    is_followed_by: 0,
    thread_fbid: null,
    thread_last_activity_at: null,
    final_dm_score: 0,
    interaction_score: 0,
    ...overrides,
  };
}
