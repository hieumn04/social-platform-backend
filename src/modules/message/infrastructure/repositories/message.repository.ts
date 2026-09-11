import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import { MessageSqlRow } from '@/types/typeModel/message-raw';
import { ThreadMessageCursor } from '@/types/typeModel/message';

@Injectable()
export class MessageRepositoryRaw {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MessageRepositoryRaw');
  }

  async findLatestMessagesByThread(
    threadId: string,
    limit = 5,
  ): Promise<MessageSqlRow[]> {
    const MAX_LIMIT = 51;
    const safeLimit = Math.max(1, Math.min(Math.trunc(limit), MAX_LIMIT));

    const sql = `
    SELECT /*+ INDEX(direct_messages idx_dm_thread_active_message) */
      message_id,
      client_context,
      thread_id,
      sender_fbid,
      content_type,
      text_body,
      igd_snippet,
      timestamp_ms,
      expiration_timestamp_ms,
      view_expiration_timestamp_ms,
      reply_to_message_id,
      payload
    FROM direct_messages
    WHERE thread_id = ?
      AND is_deleted = false
    ORDER BY message_id DESC
    LIMIT ?
  `;

    return this.dataSource.query<MessageSqlRow[]>(sql, [threadId, safeLimit]);
  }

  async findLatestMessagesBatchByThreads(
    inputs: ThreadMessageCursor[],
    limitPerThread = 5,
  ): Promise<MessageSqlRow[]> {
    if (!inputs.length) return [];

    const MAX_LIMIT = 51;
    const safeLimit = Math.max(
      1,
      Math.min(Math.trunc(limitPerThread), MAX_LIMIT),
    );

    const subQueries: string[] = [];
    const params: any[] = [];

    for (const input of inputs) {
      subQueries.push(`
      SELECT * FROM (
        SELECT /*+ INDEX(direct_messages idx_dm_thread_active_message) */
          message_id,
          client_context,
          thread_id,
          sender_fbid,
          content_type,
          text_body,
          igd_snippet,
          timestamp_ms,
          expiration_timestamp_ms,
          view_expiration_timestamp_ms,
          reply_to_message_id,
          payload
        FROM direct_messages
        WHERE is_deleted = false
          AND thread_id = ?
          AND message_id <= ?
        ORDER BY message_id DESC
        LIMIT ?
      ) sub
    `);

      params.push(input.threadId, input.lastMessageId, safeLimit);
    }

    const sql = `
    SELECT
      message_id,
      client_context,
      thread_id,
      sender_fbid,
      content_type,
      text_body,
      igd_snippet,
      timestamp_ms,
      expiration_timestamp_ms,
      view_expiration_timestamp_ms,
      reply_to_message_id,
      payload
    FROM (
      ${subQueries.join(' UNION ALL ')}
    ) t
    ORDER BY thread_id, message_id DESC
  `;

    return this.dataSource.query<MessageSqlRow[]>(sql, params);
  }

  async findMessagesBeforeCursor(
    threadId: string,
    cursorMessageId: string,
    limit = 20,
  ): Promise<MessageSqlRow[]> {
    const MAX_LIMIT = 51;
    const safeLimit = Math.max(1, Math.min(Math.trunc(limit), MAX_LIMIT));

    const sql = `
    SELECT /*+ INDEX(direct_messages idx_dm_thread_active_message) */
      message_id,
      client_context,
      thread_id,
      sender_fbid,
      content_type,
      text_body,
      igd_snippet,
      timestamp_ms,
      expiration_timestamp_ms,
      view_expiration_timestamp_ms,
      reply_to_message_id,
      payload
    FROM direct_messages
    WHERE thread_id = ?
      AND is_deleted = false
      AND message_id < ?
    ORDER BY  message_id DESC
    LIMIT ?
  `;

    return this.dataSource.query<MessageSqlRow[]>(sql, [
      threadId,
      cursorMessageId,
      safeLimit,
    ]);
  }

  async findMessageInThread(
    threadId: string,
    messageId: string,
  ): Promise<{
    message_id: string;
    sender_fbid: string;
    timestamp_ms: string;
  } | null> {
    const rows = await this.dataSource.query<
      Array<{
        message_id: string;
        sender_fbid: string;
        timestamp_ms: string;
      }>
    >(
      `
      SELECT
        message_id,
        sender_fbid,
        timestamp_ms
      FROM direct_messages
      WHERE thread_id = ?
        AND message_id = ?
        AND is_deleted = false
      LIMIT 1
      `,
      [threadId, messageId],
    );

    return rows[0] ?? null;
  }
}
