import { DataSource } from 'typeorm';
import { RecipientSearchRepositoryImpl } from './recipient-search.repository.impl';

describe('RecipientSearchRepositoryImpl', () => {
  it('searches and ranks recipients in one query', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id: '20',
        username: 'zhouye11',
        full_name: 'Zhou Ye',
        profile_pic_url: null,
        is_verified: '1',
        thread_fbid: '1000',
      },
    ]);
    const repository = new RecipientSearchRepositoryImpl({
      query,
    } as unknown as DataSource);

    await expect(repository.search('10', 'zhou', 20)).resolves.toEqual([
      {
        id: '20',
        username: 'zhouye11',
        fullName: 'Zhou Ye',
        profilePicUrl: null,
        isVerified: true,
        threadFbid: '1000',
      },
    ]);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('ROW_NUMBER() OVER');
    expect(sql).toContain('LOCATE(si.keyword');
    expect(sql).toContain('block_edge');
    expect(parameters).toEqual([
      'zhou',
      'IG_ONLY_ONE_TO_ONE',
      '10',
      '10',
      '10',
      '10',
      '10',
      '10',
      20,
    ]);
  });
});
