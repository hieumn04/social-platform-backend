import { Client } from '@elastic/elasticsearch';
import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { elasticsearchConfig } from '@/shared/config/elasticsearch.config';
import { AppLogger } from '@/shared/logger/applogger';
import {
  ELASTICSEARCH_CLIENT,
  ElasticsearchIndexKeys,
} from '@/shared/search/elasticsearch.constants';

export interface UserDirectoryCandidate {
  userId: string;
  score: number;
}

@Injectable()
export class UserDirectorySearchService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly readAlias: string;
  private readonly writeAlias: string;
  private readonly physicalIndex: string;
  private ready = false;

  constructor(
    @Inject(ELASTICSEARCH_CLIENT)
    private readonly client: Client | null,
    @Inject(elasticsearchConfig.KEY)
    private readonly config: ConfigType<typeof elasticsearchConfig>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserDirectorySearchService.name);
    this.readAlias = ElasticsearchIndexKeys.userDirectoryReadAlias(
      config.userIndexBase,
    );
    this.writeAlias = ElasticsearchIndexKeys.userDirectoryWriteAlias(
      config.userIndexBase,
    );
    this.physicalIndex = ElasticsearchIndexKeys.userDirectoryPhysical(
      config.userIndexBase,
      config.userIndexVersion,
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.client) return;

    try {
      await this.ensureIndex();
      this.ready = true;
      this.logger.log('Elasticsearch user directory is ready', {
        readAlias: this.readAlias,
        writeAlias: this.writeAlias,
      });
    } catch (error) {
      this.logger.error('Elasticsearch user directory initialization failed', {
        error,
      });
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.client) return;
    await this.client.close();
  }

  isReady(): boolean {
    return this.ready;
  }

  getClient(): Client | null {
    return this.ready ? this.client : null;
  }

  getWriteAlias(): string {
    return this.writeAlias;
  }

  async search(
    normalizedQuery: string,
    size = 100,
  ): Promise<UserDirectoryCandidate[] | null> {
    if (!this.config.readEnabled || !this.client || !this.ready) return null;

    try {
      const response = await this.client.search({
        index: this.readAlias,
        size,
        _source: false,
        track_total_hits: false,
        query: {
          bool: {
            minimum_should_match: 1,
            filter: [
              { term: { is_active: true } },
              { term: { is_deleted: false } },
            ],
            should: [
              {
                term: {
                  username: {
                    value: normalizedQuery,
                    boost: 100,
                    _name: 'username_exact',
                  },
                },
              },
              {
                prefix: {
                  username: {
                    value: normalizedQuery,
                    boost: 40,
                    _name: 'username_prefix',
                  },
                },
              },
              {
                multi_match: {
                  query: normalizedQuery,
                  type: 'bool_prefix',
                  fields: [
                    'full_name',
                    'full_name._2gram',
                    'full_name._3gram',
                    'username.autocomplete',
                  ],
                  boost: 15,
                  _name: 'name_prefix',
                },
              },
              {
                wildcard: {
                  'username.wildcard': {
                    value: `*${this.escapeWildcard(normalizedQuery)}*`,
                    boost: 5,
                    _name: 'username_contains',
                  },
                },
              },
              {
                match: {
                  full_name: {
                    query: normalizedQuery,
                    fuzziness: 'AUTO',
                    prefix_length: 1,
                    boost: 2,
                    _name: 'name_fuzzy',
                  },
                },
              },
            ],
          },
        },
      });

      return response.hits.hits.map((hit) => ({
        userId: String(hit._id),
        score: hit._score ?? 0,
      }));
    } catch (error) {
      this.logger.warn('Elasticsearch candidate retrieval failed', { error });
      return null;
    }
  }

  private async ensureIndex(): Promise<void> {
    if (!this.client) return;

    const exists = await this.client.indices.exists({
      index: this.physicalIndex,
    });

    if (!exists) {
      try {
        await this.client.indices.create({
          index: this.physicalIndex,
          settings: {
            analysis: {
              analyzer: {
                username_autocomplete: {
                  type: 'custom',
                  tokenizer: 'username_edge_ngram',
                  filter: ['lowercase', 'asciifolding'],
                },
              },
              tokenizer: {
                username_edge_ngram: {
                  type: 'edge_ngram',
                  min_gram: 1,
                  max_gram: 20,
                  token_chars: ['letter', 'digit'],
                },
              },
              normalizer: {
                lowercase_normalizer: {
                  type: 'custom',
                  filter: ['lowercase', 'asciifolding'],
                },
              },
            },
          },
          mappings: {
            dynamic: 'strict',
            properties: {
              user_id: { type: 'keyword' },
              username: {
                type: 'keyword',
                normalizer: 'lowercase_normalizer',
                fields: {
                  autocomplete: {
                    type: 'text',
                    analyzer: 'username_autocomplete',
                    search_analyzer: 'standard',
                  },
                  wildcard: { type: 'wildcard' },
                },
              },
              full_name: { type: 'search_as_you_type' },
              avatar_url: { type: 'keyword', index: false },
              is_verified: { type: 'boolean' },
              is_private: { type: 'boolean' },
              is_active: { type: 'boolean' },
              is_deleted: { type: 'boolean' },
              updated_at: { type: 'date' },
            },
          },
        });
      } catch (error) {
        // Multiple application instances may race during first deployment.
        if (!this.isResourceAlreadyExistsError(error)) throw error;
      }
    }

    const readAliasExists = await this.client.indices.existsAlias({
      name: this.readAlias,
    });
    const writeAliasExists = await this.client.indices.existsAlias({
      name: this.writeAlias,
    });

    const actions: Array<Record<string, unknown>> = [];
    if (!readAliasExists) {
      actions.push({
        add: { index: this.physicalIndex, alias: this.readAlias },
      });
    }
    if (!writeAliasExists) {
      actions.push({
        add: {
          index: this.physicalIndex,
          alias: this.writeAlias,
          is_write_index: true,
        },
      });
    }
    if (actions.length) {
      await this.client.indices.updateAliases({ actions });
    }
  }

  private escapeWildcard(value: string): string {
    return value.replace(/[\\*?]/g, '\\$&');
  }

  private isResourceAlreadyExistsError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as {
      meta?: { body?: { error?: { type?: string } } };
    };
    return (
      candidate.meta?.body?.error?.type === 'resource_already_exists_exception'
    );
  }
}
