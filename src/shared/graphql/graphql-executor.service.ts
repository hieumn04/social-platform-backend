import { Injectable } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { execute, parse, DocumentNode } from 'graphql';

@Injectable()
export class GraphqlExecutorService {
  private documentCache = new Map<string, DocumentNode>();

  constructor(private readonly schemaHost: GraphQLSchemaHost) {}

  async execute(query: string, variables: any, context: any) {
    const schema = this.schemaHost.schema;

    let document = this.documentCache.get(query);

    if (!document) {
      document = parse(query);
      this.documentCache.set(query, document);
    }

    return execute({
      schema,
      document,
      variableValues: variables,
      contextValue: context,
    });
  }
}
