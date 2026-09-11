import { DataSource, EntityManager } from 'typeorm';
import { SocialGraphRepositoryImpl } from './social-graph.repository.impl';

interface RepositoryFixture {
  repository: SocialGraphRepositoryImpl;
  query: jest.Mock;
}

const statusRow = {
  following: 0,
  outgoing_request: 0,
  incoming_request: 0,
  followed_by: 0,
  is_bestie: 0,
  is_private: 0,
  is_restricted: 0,
  blocking: 0,
  blocked_by: 0,
};

function createFixture(isPrivate: boolean): RepositoryFixture {
  const query = jest.fn(async (sql: string) => {
    if (sql.includes('SELECT user_id, username, is_private')) {
      return [
        {
          user_id: '20',
          username: 'target',
          is_private: isPrivate ? 1 : 0,
        },
      ];
    }
    if (sql.includes('SELECT 1 AS found') && sql.includes('FROM block_edge')) {
      return [];
    }
    if (sql.includes('SELECT 1 AS found') && sql.includes('FROM follow_edge')) {
      return [];
    }
    if (sql.includes('u.is_private')) {
      return [
        {
          ...statusRow,
          following: isPrivate ? 0 : 1,
          outgoing_request: isPrivate ? 1 : 0,
          is_private: isPrivate ? 1 : 0,
        },
      ];
    }
    return [];
  });
  const manager = { query } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn(async (work: (value: EntityManager) => unknown) =>
      work(manager),
    ),
  } as unknown as DataSource;

  return {
    repository: new SocialGraphRepositoryImpl(dataSource),
    query,
  };
}

describe('SocialGraphRepositoryImpl.follow', () => {
  it('creates an accepted edge for a public account', async () => {
    const { repository, query } = createFixture(false);

    const result = await repository.follow('10', '20');

    expect(result.kind).toBe('FOLLOWING');
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('INSERT IGNORE INTO follow_edge'),
      ),
    ).toBe(true);
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('INSERT INTO follow_request_edge'),
      ),
    ).toBe(false);
  });

  it('creates a pending request for a private account', async () => {
    const { repository, query } = createFixture(true);

    const result = await repository.follow('10', '20');

    expect(result.kind).toBe('REQUESTED');
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('INSERT INTO follow_request_edge'),
      ),
    ).toBe(true);
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('INSERT IGNORE INTO follow_edge'),
      ),
    ).toBe(false);
  });

  it('does not write when either user has blocked the other', async () => {
    const { repository, query } = createFixture(false);
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT user_id, username, is_private')) {
        return [{ user_id: '20', username: 'target', is_private: 0 }];
      }
      if (
        sql.includes('SELECT 1 AS found') &&
        sql.includes('FROM block_edge')
      ) {
        return [{ found: 1 }];
      }
      return [];
    });

    await expect(repository.follow('10', '20')).resolves.toEqual({
      kind: 'FOLLOW_FORBIDDEN',
    });
    expect(
      query.mock.calls.some(([sql]) => String(sql).includes('INSERT')),
    ).toBe(false);
  });
});
