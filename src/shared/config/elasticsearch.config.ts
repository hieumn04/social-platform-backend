import { registerAs } from '@nestjs/config';

export interface ElasticsearchConfig {
  enabled: boolean;
  readEnabled: boolean;
  node: string;
  username?: string;
  password?: string;
  userIndexBase: string;
  userIndexVersion: number;
  outboxPollMs: number;
  outboxBatchSize: number;
}

export const elasticsearchConfig = registerAs(
  'elasticsearch',
  (): ElasticsearchConfig => {
    const enabled = process.env.ELASTICSEARCH_ENABLED === 'true';

    return {
      enabled,
      readEnabled: enabled && process.env.ELASTICSEARCH_READ_ENABLED === 'true',
      node: process.env.ELASTICSEARCH_NODE ?? 'http://localhost:9200',
      username: process.env.ELASTICSEARCH_USERNAME || undefined,
      password: process.env.ELASTICSEARCH_PASSWORD || undefined,
      userIndexBase:
        process.env.ELASTICSEARCH_USER_INDEX_BASE ?? 'user_directory_search',
      userIndexVersion: Number(
        process.env.ELASTICSEARCH_USER_INDEX_VERSION ?? '1',
      ),
      outboxPollMs: Number(process.env.ELASTICSEARCH_OUTBOX_POLL_MS ?? '1000'),
      outboxBatchSize: Number(
        process.env.ELASTICSEARCH_OUTBOX_BATCH_SIZE ?? '200',
      ),
    };
  },
);
