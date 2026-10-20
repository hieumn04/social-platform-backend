import { Client } from '@elastic/elasticsearch';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { elasticsearchConfig } from '@/shared/config/elasticsearch.config';
import { ConfigModule } from '@/shared/config/config.module';
import { DatabaseModule } from '@/shared/database/database.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { ELASTICSEARCH_CLIENT } from '@/shared/search/elasticsearch.constants';
import { SearchOutboxWorker } from '@/shared/search/search-outbox.worker';
import { UserDirectorySearchService } from '@/shared/search/user-directory-search.service';

@Module({
  imports: [ConfigModule, DatabaseModule, LoggerModule],
  providers: [
    {
      provide: ELASTICSEARCH_CLIENT,
      inject: [elasticsearchConfig.KEY],
      useFactory: (
        config: ConfigType<typeof elasticsearchConfig>,
      ): Client | null => {
        if (!config.enabled) return null;

        return new Client({
          node: config.node,
          auth:
            config.username && config.password
              ? {
                  username: config.username,
                  password: config.password,
                }
              : undefined,
        });
      },
    },
    UserDirectorySearchService,
    SearchOutboxWorker,
  ],
  exports: [ELASTICSEARCH_CLIENT, UserDirectorySearchService],
})
export class SearchInfrastructureModule {}
