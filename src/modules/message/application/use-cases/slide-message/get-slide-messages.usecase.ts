import {
  decodeMessageCursor,
  encodeMessageCursor,
} from '@/shared/graphql/message-cursor';
import { MessageContentBuilder } from '@/modules/message/domain/service/message-content.builder';
import { MessageRepositoryRaw } from '@/modules/message/infrastructure/repositories/message.repository';
import { AppLogger } from '@/shared/logger/applogger';
import { ThreadMessageCursor } from '@/types/typeModel/message';
import {
  MessageSqlRow,
  SlideMessageConnection,
  SlideMessageEdge,
} from '@/types/typeModel/message-raw';

import { Injectable, Optional } from '@nestjs/common';
import { RecentMessageCacheService } from '@/shared/redis-cluster/conversation/services/recent-message-cache.service';
import { R2StorageService } from '@/shared/storage/r2/r2-storage.service';

const MYSQL_SIGNED_BIGINT_MAX = '9223372036854775807';

@Injectable()
export class GetSlideMessageConnectionUseCase {
  constructor(
    private readonly messageRepo: MessageRepositoryRaw,
    private readonly logger: AppLogger,
    private readonly recentMessageCache?: RecentMessageCacheService,
    @Optional() private readonly storage?: R2StorageService,
  ) {
    this.logger.setContext(GetSlideMessageConnectionUseCase.name);
  }

  async execute(
    inputs: ThreadMessageCursor[],
    limitPerThread = 5,
  ): Promise<{ threadId: string; connection: SlideMessageConnection }[]> {
    if (!inputs.length) return [];

    const fetchLimit = limitPerThread + 1;

    const rows = await this.messageRepo.findLatestMessagesBatchByThreads(
      inputs.map((i) => ({
        threadId: i.threadId,
        // Never convert Snowflake IDs to JavaScript numbers. Current IDs are
        // already larger than Number.MAX_SAFE_INTEGER and would be rounded.
        lastMessageId: i.lastMessageId ?? MYSQL_SIGNED_BIGINT_MAX,
      })),
      fetchLimit,
    );

    const map = new Map<string, MessageSqlRow[]>();
    for (const row of rows) {
      if (!map.has(row.thread_id)) {
        map.set(row.thread_id, []);
      }
      map.get(row.thread_id)!.push(row);
    }

    return Promise.all(
      inputs.map(async (input) => {
        const threadRows = map.get(input.threadId) ?? [];

        const hasNextPage = threadRows.length === fetchLimit;

        const sliced = hasNextPage
          ? threadRows.slice(0, limitPerThread)
          : threadRows;

        const edges: SlideMessageEdge[] = await Promise.all(
          sliced.map(async (row) => ({
            cursor: encodeMessageCursor(row.message_id),
            node: {
              id: row.message_id,
              message_id: row.message_id,
              thread_fbid: input.threadFbid ?? input.threadId,
              offline_threading_id: row.client_context,
              sender_fbid: row.sender_fbid,
              timestamp_ms: String(row.timestamp_ms),

              content_type: row.content_type,
              text_body: row.text_body,
              igd_snippet: row.igd_snippet,

              expiration_timestamp_ms:
                row.expiration_timestamp_ms == null
                  ? null
                  : String(row.expiration_timestamp_ms),
              view_expiration_timestamp_ms:
                row.view_expiration_timestamp_ms == null
                  ? null
                  : String(row.view_expiration_timestamp_ms),

              content: await MessageContentBuilder.build(
                row,
                this.storage?.createPrivateDeliveryUrl.bind(this.storage),
              ),
              replied_to_message_id: row.reply_to_message_id ?? null,
            },
          })),
        );

        return {
          threadId: input.threadId,
          connection: {
            edges,
            page_info: {
              has_next_page: hasNextPage,
              has_previous_page: false,
              start_cursor: edges.length ? edges[0].cursor : undefined,
              end_cursor: edges.length
                ? edges[edges.length - 1].cursor
                : undefined,
            },
          },
        };
      }),
    );
  }

  async executePage(input: {
    conversationId: string;
    threadFbid: string;
    before?: string | null;
    limit?: number;
  }): Promise<SlideMessageConnection> {
    const limit = Math.max(1, Math.min(input.limit ?? 20, 50));
    const fetchLimit = limit + 1;
    const cursorMessageId = input.before
      ? decodeMessageCursor(input.before)
      : undefined;

    let rows: MessageSqlRow[];
    if (cursorMessageId) {
      rows = await this.messageRepo.findMessagesBeforeCursor(
        input.conversationId,
        cursorMessageId,
        fetchLimit,
      );
    } else {
      const cached = this.recentMessageCache
        ? await this.recentMessageCache.getLatest(
            input.conversationId,
            fetchLimit,
          )
        : { rows: null, generation: '0' };

      if (cached.rows) {
        rows = cached.rows;
      } else {
        rows = await this.messageRepo.findLatestMessagesByThread(
          input.conversationId,
          fetchLimit,
        );
        await this.recentMessageCache?.setLatestIfGenerationMatches(
          input.conversationId,
          fetchLimit,
          cached.generation,
          rows,
        );
      }
    }

    const hasNextPage = rows.length > limit;
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows;
    const edges: SlideMessageEdge[] = await Promise.all(
      pageRows.map(async (row) => ({
        cursor: encodeMessageCursor(row.message_id),
        node: {
          id: row.message_id,
          message_id: row.message_id,
          thread_fbid: input.threadFbid,
          offline_threading_id: row.client_context,
          sender_fbid: row.sender_fbid,
          timestamp_ms: String(row.timestamp_ms),
          content_type: row.content_type,
          text_body: row.text_body,
          igd_snippet: row.igd_snippet,
          expiration_timestamp_ms:
            row.expiration_timestamp_ms == null
              ? null
              : String(row.expiration_timestamp_ms),
          view_expiration_timestamp_ms:
            row.view_expiration_timestamp_ms == null
              ? null
              : String(row.view_expiration_timestamp_ms),
          content: await MessageContentBuilder.build(
            row,
            this.storage?.createPrivateDeliveryUrl.bind(this.storage),
          ),
          replied_to_message_id: row.reply_to_message_id ?? null,
        },
      })),
    );

    return {
      edges,
      page_info: {
        has_next_page: hasNextPage,
        has_previous_page: Boolean(input.before),
        start_cursor: edges.length ? edges[0].cursor : undefined,
        end_cursor: edges.length ? edges[edges.length - 1].cursor : undefined,
      },
    };
  }
}
