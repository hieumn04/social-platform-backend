import { PERSISTED_QUERY_REGISTRY } from '@/shared/graphql/persisted-queries.registry';
import { buildSchema, parse, validate } from 'graphql';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('share sheet GraphQL schema', () => {
  it('exposes the input contract and validates the persisted query', () => {
    const schemaSource = [
      'src/shared/graphql/query/root-query.graphql',
      'src/modules/share-sheet/presentation/graphql/share-sheet.schema.graphql',
    ]
      .map((file) => readFileSync(resolve(process.cwd(), file), 'utf8'))
      .join('\n');

    const schema = buildSchema(schemaSource);
    const query = schema.getQueryType()?.getFields().get_share_sheet_ranking;

    expect(query).toBeDefined();
    expect(query?.args.map((argument) => argument.name)).toEqual(['input']);

    const persistedQuery = PERSISTED_QUERY_REGISTRY['26933070283055509'];
    expect(persistedQuery).toBeDefined();
    expect(validate(schema, parse(persistedQuery))).toEqual([]);
  });
});
