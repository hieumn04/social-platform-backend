import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PERSISTED_QUERY_REGISTRY } from '@/shared/graphql/persisted-queries.registry';
import { buildSchema, parse, validate } from 'graphql';

describe('social graph GraphQL schema', () => {
  it('extends the existing schema with the friendship mutation', () => {
    const schemaSource = [
      'src/shared/graphql/query/root-query.graphql',
      'src/modules/users/presentation/graphql/users.schema.graphql',
      'src/modules/social-graph/presentation/graphql/social-graph.schema.graphql',
    ]
      .map((file) => readFileSync(resolve(process.cwd(), file), 'utf8'))
      .join('\n');

    const schema = buildSchema(schemaSource);
    const mutation = schema
      .getMutationType()
      ?.getFields().xdt_create_friendship;

    expect(mutation).toBeDefined();
    expect(mutation?.args.map((argument) => argument.name)).toEqual([
      'target_user_id',
      'container_module',
      'nav_chain',
    ]);

    const persistedMutation = PERSISTED_QUERY_REGISTRY['26508036048874888'];
    expect(persistedMutation).toBeDefined();
    expect(validate(schema, parse(persistedMutation))).toEqual([]);
  });
});
