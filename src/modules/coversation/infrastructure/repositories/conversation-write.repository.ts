import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import { ConversationSubtype } from '@/shared/enums/roomStatus.enum';

export interface CreateConversationDto {
  conversationId: string;
  subtype: ConversationSubtype;
  createdBy?: string;

  title?: string;
  avatarUrl?: string;
}

@Injectable()
export class ConversationWriteRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('ConversationWriteRepository');
  }

  /* =====================================================
   * CREATE CONVERSATION
   * ===================================================== */
  async create(
    data: CreateConversationDto,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      INSERT INTO conversations (
        conversation_id,
        subtype,
        created_by,
        title,
        avatar_url,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await runner.query(sql, [
      data.conversationId,
      data.subtype,
      data.createdBy ?? null,
      data.title ?? null,
      data.avatarUrl ?? null,
    ]);
  }

  /* =====================================================
   * UPSERT (idempotent create)
   * ===================================================== */
  async createIfNotExists(
    data: CreateConversationDto,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      INSERT INTO conversations (
        conversation_id,
        subtype,
        created_by,
        title,
        avatar_url,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        conversation_id = conversation_id
    `;

    await runner.query(sql, [
      data.conversationId,
      data.subtype,
      data.createdBy ?? null,
      data.title ?? null,
      data.avatarUrl ?? null,
    ]);
  }

  /* =====================================================
   * UPDATE LAST MESSAGE (CRITICAL 🔥)
   * ===================================================== */
  async updateLastMessage(
    conversationId: string,
    messageId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      UPDATE conversations
      SET
        last_message_id = ?,
        created_at = created_at
      WHERE conversation_id = ?
    `;

    await runner.query(sql, [messageId, conversationId]);
  }

  /* =====================================================
   * SAFE UPDATE LAST MESSAGE (ANTI-RACE CONDITION)
   * ===================================================== */
  async updateLastMessageIfNewer(
    conversationId: string,
    messageId: string,
    messageTimestamp: number,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    /**
     * 🔥 tránh race condition:
     * chỉ update nếu message mới hơn last message hiện tại
     */
    const sql = `
      UPDATE conversations c
      SET c.last_message_id = ?
      WHERE c.conversation_id = ?
        AND (
          c.last_message_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM direct_messages m
            WHERE m.message_id = c.last_message_id
              AND m.timestamp_ms < ?
          )
        )
    `;

    await runner.query(sql, [messageId, conversationId, messageTimestamp]);
  }

  /* =====================================================
   * UPDATE METADATA (title / avatar)
   * ===================================================== */
  async updateMetadata(
    conversationId: string,
    data: {
      title?: string;
      avatarUrl?: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      UPDATE conversations
      SET
        title = COALESCE(?, title),
        avatar_url = COALESCE(?, avatar_url)
      WHERE conversation_id = ?
    `;

    await runner.query(sql, [
      data.title ?? null,
      data.avatarUrl ?? null,
      conversationId,
    ]);
  }

  /* =====================================================
   * DELETE (rarely used – usually soft delete at participant level)
   * ===================================================== */
  async hardDelete(
    conversationId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      DELETE FROM conversations
      WHERE conversation_id = ?
    `;

    await runner.query(sql, [conversationId]);
  }
}
