import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';

import { elasticsearchConfig } from '@/shared/config/elasticsearch.config';
import { AppLogger } from '@/shared/logger/applogger';
import { UserDirectorySearchService } from '@/shared/search/user-directory-search.service';

interface SearchOutboxRow {
  id: string;
  aggregate_id: string;
  event_type: 'USER_UPSERTED' | 'USER_DELETED';
  payload: string | Record<string, unknown>;
}

@Injectable()
export class SearchOutboxWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly workerId = randomUUID();
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(elasticsearchConfig.KEY)
    private readonly config: ConfigType<typeof elasticsearchConfig>,
    private readonly directory: UserDirectorySearchService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SearchOutboxWorker.name);
  }

  onModuleInit(): void {
    if (!this.config.enabled) return;

    this.timer = setInterval(() => void this.tick(), this.config.outboxPollMs);
    this.timer.unref();
    void this.tick();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    if (this.running || !this.directory.isReady()) return;
    this.running = true;

    try {
      const rows = await this.claimBatch();
      if (!rows.length) return;
      await this.publish(rows);
      await this.complete(rows.map((row) => row.id));
    } catch (error) {
      this.logger.error('Search outbox batch failed', { error });
      await this.releaseFailedBatch(error);
    } finally {
      this.running = false;
    }
  }

  private claimBatch(): Promise<SearchOutboxRow[]> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.query(
        `UPDATE search_outbox
         SET status = 'FAILED', locked_by = NULL, locked_at = NULL,
             available_at = NOW(6), last_error = 'Reclaimed stale processing lease'
         WHERE status = 'PROCESSING'
           AND locked_at < DATE_SUB(NOW(6), INTERVAL 5 MINUTE)`,
      );

      const rows = await manager.query<SearchOutboxRow[]>(
        `SELECT id, aggregate_id, event_type, payload
         FROM search_outbox
         WHERE status IN ('PENDING', 'FAILED')
           AND available_at <= NOW(6)
         ORDER BY id
         LIMIT ?
         FOR UPDATE SKIP LOCKED`,
        [this.config.outboxBatchSize],
      );

      if (!rows.length) return [];
      const placeholders = rows.map(() => '?').join(',');
      await manager.query(
        `UPDATE search_outbox
         SET status = 'PROCESSING', locked_by = ?, locked_at = NOW(6),
             attempt_count = attempt_count + 1
         WHERE id IN (${placeholders})`,
        [this.workerId, ...rows.map((row) => row.id)],
      );
      return rows;
    });
  }

  private async publish(rows: SearchOutboxRow[]): Promise<void> {
    const client = this.directory.getClient();
    if (!client) throw new Error('Elasticsearch client is not ready');

    const operations: Record<string, unknown>[] = [];
    for (const row of rows) {
      const version = Number(row.id);
      if (row.event_type === 'USER_DELETED') {
        operations.push({
          delete: {
            _index: this.directory.getWriteAlias(),
            _id: String(row.aggregate_id),
            version,
            version_type: 'external_gte',
          },
        });
        continue;
      }

      operations.push({
        index: {
          _index: this.directory.getWriteAlias(),
          _id: String(row.aggregate_id),
          version,
          version_type: 'external_gte',
        },
      });
      const payload =
        typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      operations.push(this.normalizeUserDocument(payload));
    }

    const result = await client.bulk({ refresh: false, operations });
    if (result.errors) {
      const failures = result.items
        .map((item) => item.index ?? item.delete)
        .filter((item) => item?.error)
        .slice(0, 3)
        .map((item) => item?.error);
      throw new Error(`Elasticsearch bulk failed: ${JSON.stringify(failures)}`);
    }
  }

  private async complete(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.dataSource.query(
      `UPDATE search_outbox
       SET status = 'COMPLETED', processed_at = NOW(6),
           locked_by = NULL, locked_at = NULL, last_error = NULL
       WHERE locked_by = ? AND id IN (${placeholders})`,
      [this.workerId, ...ids],
    );
  }

  private async releaseFailedBatch(error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    await this.dataSource.query(
      `UPDATE search_outbox
       SET status = 'FAILED', available_at = DATE_ADD(NOW(6), INTERVAL LEAST(300, POW(2, attempt_count)) SECOND),
           locked_by = NULL, locked_at = NULL, last_error = LEFT(?, 2000)
       WHERE locked_by = ? AND status = 'PROCESSING'`,
      [message, this.workerId],
    );
  }

  private normalizeUserDocument(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...payload,
      user_id: String(payload.user_id),
      is_verified: this.toBoolean(payload.is_verified),
      is_private: this.toBoolean(payload.is_private),
      is_active: this.toBoolean(payload.is_active),
      is_deleted: this.toBoolean(payload.is_deleted),
    };
  }

  private toBoolean(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
  }
}
