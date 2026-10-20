import { ElasticsearchIndexKeys } from './elasticsearch.constants';

describe('ElasticsearchIndexKeys', () => {
  it('builds stable versioned user-directory index names', () => {
    expect(
      ElasticsearchIndexKeys.userDirectoryPhysical('user_directory_search', 2),
    ).toBe('user_directory_search_v2');
    expect(
      ElasticsearchIndexKeys.userDirectoryReadAlias('user_directory_search'),
    ).toBe('user_directory_search_read');
    expect(
      ElasticsearchIndexKeys.userDirectoryWriteAlias('user_directory_search'),
    ).toBe('user_directory_search_write');
  });
});
