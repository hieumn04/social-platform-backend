import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PERSISTED_QUERY_REGISTRY } from '@/shared/graphql/persisted-queries.registry';
import { buildSchema, parse, validate } from 'graphql';

describe('profile GraphQL schema', () => {
  it('accepts userID and validates the persisted initial profile query', () => {
    const schemaSource = [
      'src/shared/graphql/query/root-query.graphql',
      'src/modules/users/presentation/graphql/users.schema.graphql',
      'src/modules/social-graph/presentation/graphql/social-graph.schema.graphql',
      'src/modules/profile/presentation/graphql/profile.schema.graphql',
    ]
      .map((file) => readFileSync(resolve(process.cwd(), file), 'utf8'))
      .join('\n');

    const schema = buildSchema(schemaSource);
    const query = schema.getQueryType()?.getFields().get_profile_initial;

    expect(query).toBeDefined();
    expect(query?.args.map((argument) => argument.name)).toEqual(['userID']);

    const persistedQuery = PERSISTED_QUERY_REGISTRY['28949219061332276'];
    expect(persistedQuery).toBeDefined();
    expect(validate(schema, parse(persistedQuery))).toEqual([]);
  });
});
