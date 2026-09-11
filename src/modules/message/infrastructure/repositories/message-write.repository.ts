import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import { MessageStatus, MessageType } from '@/shared/enums/message.enum';

export interface InsertMessageDto {
  messageId: string;
  threadId: string;
  senderFbid: string;
  clientContext: string;

  contentType: MessageType;
  textBody?: string;
  snippet?: string;
  payload?: Record<string, any>;

  replyToMessageId?: string | null;

  timestampMs: number;
  clientTimestampMs?: string | number;

  expirationTimestampMs?: number;
  viewExpirationTimestampMs?: number;
}

@Injectable()
export class MessageWriteRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MessageWriteRepository');
  }

  /* =====================================================
   * INSERT MESSAGE (transaction-safe + idempotent)
   * ===================================================== */
  async findByClientContext(
    threadId: string,
    clientContext: string,
    manager?: EntityManager,
  ): Promise<{ messageId: string; timestampMs: number } | null> {
    const runner = manager ?? this.dataSource;
    const rows = await runner.query<
      Array<{ message_id: string; timestamp_ms: string }>
    >(
      `SELECT message_id, timestamp_ms FROM direct_messages
       WHERE thread_id = ? AND client_context = ? LIMIT 1`,
      [threadId, clientContext],
    );
    return rows[0]
      ? {
          messageId: String(rows[0].message_id),
          timestampMs: Number(rows[0].timestamp_ms),
        }
      : null;
  }

  async findByClientContextForSender(
    threadId: string,
    clientContext: string,
    senderId: string,
  ): Promise<{ messageId: string; timestampMs: number } | null> {
    const rows = await this.dataSource.query<
      Array<{ message_id: string; timestamp_ms: string }>
    >(
      `SELECT message_id, timestamp_ms FROM direct_messages
       WHERE thread_id = ? AND client_context = ? AND sender_fbid = ? LIMIT 1`,
      [threadId, clientContext, senderId],
    );
    return rows[0]
      ? {
          messageId: String(rows[0].message_id),
          timestampMs: Number(rows[0].timestamp_ms),
        }
      : null;
  }

  async insert(
    data: InsertMessageDto,
    manager?: EntityManager,
  ): Promise<{ messageId: string; timestampMs: number; inserted: boolean }> {
    const runner = manager ?? this.dataSource;

    if (!data.clientContext) {
      throw new Error('clientContext is required');
    }

    const sql = `
      INSERT INTO direct_messages (
        message_id,
        thread_id,
        sender_fbid,
        client_context,
        content_type,
        text_body,
        igd_snippet,
        payload,
        reply_to_message_id,
        timestamp_ms,
        client_timestamp_ms,
        expiration_timestamp_ms,
        view_expiration_timestamp_ms,
        status,
        is_edited,
        is_deleted,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, false, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        message_id = message_id
    `;

    await runner.query(sql, [
      data.messageId,
      data.threadId,
      data.senderFbid,
      data.clientContext,
      data.contentType,
      data.textBody ?? null,
      data.snippet ?? this.buildSnippet(data.textBody),
      data.payload ? JSON.stringify(data.payload) : null,
      data.replyToMessageId ?? null,
      data.timestampMs,
      data.clientTimestampMs ?? null,
      data.expirationTimestampMs ?? null,
      data.viewExpirationTimestampMs ?? null,
      MessageStatus.SENT,
    ]);

    const persisted = await this.findByClientContext(
      data.threadId,
      data.clientContext,
      manager,
    );
    if (!persisted)
      throw new Error('Message insert did not produce a persisted row');
    return { ...persisted, inserted: persisted.messageId === data.messageId };
  }

  /* =====================================================
   * SOFT DELETE MESSAGE
   * ===================================================== */
  async softDelete(messageId: string, manager?: EntityManager): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      UPDATE direct_messages
      SET
        is_deleted = true,
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE message_id = ?
        AND is_deleted = false
    `;

    await runner.query(sql, [messageId]);
  }

  /* =====================================================
   * EDIT MESSAGE
   * ===================================================== */
  async editMessage(
    messageId: string,
    newText: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      UPDATE direct_messages
      SET
        text_body = ?,
        igd_snippet = ?,
        edited_at = NOW(),
        updated_at = NOW()
      WHERE message_id = ?
        AND is_deleted = false
    `;

    await runner.query(sql, [newText, this.buildSnippet(newText), messageId]);
  }

  /* =====================================================
   * HELPER
   * ===================================================== */
  private buildSnippet(text?: string): string | null {
    if (!text) return null;

    const trimmed = text.trim();
    if (trimmed.length <= 100) return trimmed;

    return trimmed.slice(0, 100);
  }
}
