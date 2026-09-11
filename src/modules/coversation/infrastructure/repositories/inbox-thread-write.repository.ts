import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import {
  ConversationSubtype,
  InboxFolder,
  ReachabilityStatus,
  SystemFolder,
} from '@/shared/enums/roomStatus.enum';

import { chunkArray } from '@/helpers/helper';

export type UpdateLastMessageItem = {
  viewerId: string;
  threadFbid: string;
  messageId: string;
  activityAt: Date;
  isSender: boolean;
};

export interface UpsertInboxThreadDto {
  id: string;
  viewerId: string;

  threadFbid: string;
  conversationId: string;
  threadKey: string;

  threadSubtype: ConversationSubtype;

  folder?: InboxFolder;
  systemFolder?: SystemFolder;
  reachabilityStatus?: ReachabilityStatus;

  displayName?: string;
  displayAvatarUrl?: string;
}

export interface UpsertInboxThreadWithLastMessageDto {
  // ==============================
  // 🔑 IDENTIFIERS
  // ==============================
  id: string;
  viewerId: string;

  threadFbid: string;
  conversationId: string;
  threadKey: string;

  threadSubtype: ConversationSubtype;

  // ==============================
  // 🟢 METADATA (optional)
  // ==============================
  folder?: InboxFolder;
  systemFolder?: SystemFolder;
  reachabilityStatus?: ReachabilityStatus | null;

  displayName?: string | null;
  displayAvatarUrl?: string | null;

  // ==============================
  // 🔥 ACTIVITY (required)
  // ==============================
  lastMessageId: string;
  lastActivityAt: Date;
  isSender: boolean;
}

@Injectable()
export class InboxThreadWriteRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('InboxThreadWriteRepository');
  }

  /* =====================================================
   * UPSERT BULK (Production Ready)
   * ===================================================== */
  async upsertBulk(
    items: UpsertInboxThreadDto[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!items.length) return;

    const runner = manager ?? this.dataSource;

    /* ==============================
     * 1. VALIDATION
     * ============================== */
    const validItems = items.filter(
      (i) =>
        i &&
        i.id &&
        i.viewerId &&
        i.threadFbid &&
        i.conversationId &&
        i.threadKey &&
        i.threadSubtype,
    );

    if (!validItems.length) return;

    /* ==============================
     * 2. DEDUPE
     * ============================== */
    const uniqueMap = new Map<string, UpsertInboxThreadDto>();

    for (const item of validItems) {
      const key = `${item.viewerId}_${item.threadFbid}`;
      uniqueMap.set(key, item);
    }

    const dedupedItems = Array.from(uniqueMap.values());

    /* ==============================
     * 3. CHUNKING
     * ============================== */
    const CHUNK_SIZE = 200;
    const chunks = chunkArray(dedupedItems, CHUNK_SIZE);

    this.logger.debug(
      `InboxThread upsertBulk total=${dedupedItems.length}, chunks=${chunks.length}`,
    );

    for (const chunk of chunks) {
      await this._upsertBulkChunk(chunk, runner);
    }
  }

  /* =====================================================
   * INTERNAL BULK CHUNK
   * ===================================================== */
  private async _upsertBulkChunk(
    items: UpsertInboxThreadDto[],
    runner: EntityManager | DataSource,
  ): Promise<void> {
    const placeholders = items
      .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())')
      .join(', ');

    const values: any[] = [];

    for (const item of items) {
      values.push(
        item.id,
        item.viewerId,
        item.threadFbid,
        item.conversationId,
        item.threadKey,
        item.threadSubtype,
        item.folder ?? InboxFolder.PRIMARY,
        item.systemFolder ?? SystemFolder.INBOX,
        item.reachabilityStatus ?? ReachabilityStatus.REACHABLE,
        item.displayName ?? null,
        item.displayAvatarUrl ?? null,
      );
    }

    const sql = `
      INSERT INTO inbox_threads (
        id,
        viewer_id,
        thread_fbid,
        conversation_id,
        thread_key,
        thread_subtype,
        folder,
        system_folder,
        reachability_status,
        display_name,
        display_avatar_url,
        created_at,
        updated_at
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        reachability_status = VALUES(reachability_status),
        display_name = COALESCE(VALUES(display_name), display_name),
        display_avatar_url = COALESCE(VALUES(display_avatar_url), display_avatar_url),
        updated_at = NOW()
    `;

    await runner.query(sql, values);
  }

  async upsertWithLastMessageBulk(
    items: UpsertInboxThreadWithLastMessageDto[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!items.length) return;

    const runner = manager ?? this.dataSource;

    /* ==============================
     * 1. VALIDATION
     * ============================== */
    const validItems = items.filter(
      (i) =>
        i &&
        i.id &&
        i.viewerId &&
        i.threadFbid &&
        i.conversationId &&
        i.threadKey &&
        i.threadSubtype &&
        i.lastMessageId &&
        i.lastActivityAt,
    );

    if (!validItems.length) return;

    /* ==============================
     * 2. DEDUPE (giữ message mới nhất)
     * ============================== */
    const map = new Map<string, UpsertInboxThreadWithLastMessageDto>();

    for (const item of validItems) {
      const key = `${item.viewerId}_${item.threadFbid}`;
      const existing = map.get(key);

      if (!existing || existing.lastActivityAt < item.lastActivityAt) {
        map.set(key, item);
      }
    }

    const deduped = Array.from(map.values());

    /* ==============================
     * 3. CHUNKING
     * ============================== */
    const CHUNK_SIZE = 200;
    const chunks = chunkArray(deduped, CHUNK_SIZE);

    this.logger.debug(
      `InboxThread upsertWithLastMessageBulk total=${deduped.length}, chunks=${chunks.length}`,
    );

    for (const chunk of chunks) {
      await this._upsertWithLastMessageChunk(chunk, runner);
    }
  }

  private async _upsertWithLastMessageChunk(
    items: UpsertInboxThreadWithLastMessageDto[],
    runner: EntityManager | DataSource,
  ): Promise<void> {
    if (!items.length) return;

    const values: any[] = [];

    // Build placeholders cho bulk insert
    const placeholders = items
      .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())')
      .join(', ');

    // Prepare values
    for (const item of items) {
      values.push(
        item.id,
        item.viewerId,
        item.threadFbid,
        item.conversationId,
        item.threadKey,
        item.threadSubtype,
        item.folder ?? InboxFolder.PRIMARY,
        item.systemFolder ?? SystemFolder.INBOX,
        item.reachabilityStatus ?? null,
        item.displayName ?? null,
        item.displayAvatarUrl ?? null,
        item.lastMessageId,
        item.lastActivityAt,
        item.isSender ? 0 : 1,
      );
    }

    const sql = `
    INSERT INTO inbox_threads (
      id,
      viewer_id,
      thread_fbid,
      conversation_id,
      thread_key,
      thread_subtype,
      folder,
      system_folder,
      reachability_status,
      display_name,
      display_avatar_url,
      last_message_id,
      last_activity_at,
      marked_as_unread,
      created_at,
      updated_at
    )
    VALUES ${placeholders}
    AS new
    ON DUPLICATE KEY UPDATE
      reachability_status = COALESCE(new.reachability_status, inbox_threads.reachability_status),
      display_name       = COALESCE(new.display_name, inbox_threads.display_name),
      display_avatar_url = COALESCE(new.display_avatar_url, inbox_threads.display_avatar_url),


      last_message_id    = IF(new.last_activity_at > inbox_threads.last_activity_at, new.last_message_id, inbox_threads.last_message_id),
      last_activity_at   = IF(new.last_activity_at > inbox_threads.last_activity_at, new.last_activity_at, inbox_threads.last_activity_at),
      marked_as_unread   = IF(new.last_activity_at > inbox_threads.last_activity_at, new.marked_as_unread, inbox_threads.marked_as_unread),
      updated_at         = IF(new.last_activity_at > inbox_threads.last_activity_at, new.last_activity_at, inbox_threads.updated_at)
  `;

    await runner.query(sql, values);
  }

  /* =====================================================
   * UPDATE LAST MESSAGE
   * ===================================================== */

  private async _createTempTable(runner: EntityManager) {
    await runner.query(`
    CREATE TEMPORARY TABLE IF NOT EXISTS tmp_inbox_update (
      viewer_id BIGINT NOT NULL,
      thread_fbid BIGINT NOT NULL,
      last_message_id BIGINT NOT NULL,
      last_activity_at DATETIME NOT NULL,
      marked_as_unread TINYINT NOT NULL,
      PRIMARY KEY (viewer_id, thread_fbid)
    ) ENGINE=MEMORY;
  `);
  }

  async updateLastMessageByThread(
    threadFbid: string,
    messageId: string,
    activityAt: Date,
    senderId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const runner = manager ?? this.dataSource;

    const result: any = await runner.query(
      `
    UPDATE inbox_threads
    SET
      last_message_id = ?,
      last_activity_at = ?,
      marked_as_unread = CASE
        WHEN viewer_id = ? THEN 0
        ELSE 1
      END,
      updated_at = NOW()
    WHERE thread_fbid = ?
      AND (
        last_activity_at IS NULL
        OR last_activity_at < ?
      )
    `,
      [messageId, activityAt, senderId, threadFbid, activityAt],
    );

    const affectedRows = result?.affectedRows ?? 0;

    /* ==============================
     * OBSERVABILITY (QUAN TRỌNG)
     * ============================== */
    if (affectedRows === 0) {
      this.logger.warn('updateLastMessageByThread: no rows updated', {
        threadFbid,
        messageId,
        senderId,
        activityAt,
      });
    } else {
      this.logger.debug('updateLastMessageByThread: success', {
        threadFbid,
        affectedRows,
      });
    }

    return affectedRows;
  }

  async updateLastMessageBulk(
    items: UpdateLastMessageItem[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!items.length) return;

    if (manager) {
      return this._processUpdate(items, manager);
    }

    await this.dataSource.transaction(async (trx) => {
      await this._processUpdate(items, trx);
    });
  }

  /* =====================================================
   * SAFE UPDATE LAST MESSAGE (ANTI-RACE)
   * ===================================================== */
  private async _processUpdate(
    items: UpdateLastMessageItem[],
    runner: EntityManager,
  ): Promise<void> {
    /* ==============================
     * 1. DEDUPE (giữ message mới nhất)
     * ============================== */
    const map = new Map<string, UpdateLastMessageItem>();

    for (const item of items) {
      const key = `${item.viewerId}_${item.threadFbid}`;
      const existing = map.get(key);

      if (!existing || existing.activityAt < item.activityAt) {
        map.set(key, item);
      }
    }

    const deduped = Array.from(map.values());

    await this._createTempTable(runner);

    /* ==============================
     * 2. CHUNKING
     * ============================== */
    const chunks = chunkArray(deduped, 200);

    for (const chunk of chunks) {
      await this._updateChunkWithTempTable(chunk, runner);
    }
  }

  private async _updateChunkWithTempTable(
    items: UpdateLastMessageItem[],
    runner: EntityManager,
  ): Promise<void> {
    if (!items.length) return;

    await runner.query(`DELETE FROM tmp_inbox_update`);

    const values: any[] = [];
    const rows: string[] = [];

    for (const item of items) {
      rows.push('(?, ?, ?, ?, ?)');

      values.push(
        item.viewerId,
        item.threadFbid,
        item.messageId,
        item.activityAt,
        item.isSender ? 0 : 1,
      );
    }

    await runner.query(
      `
      INSERT INTO tmp_inbox_update (
        viewer_id,
        thread_fbid,
        last_message_id,
        last_activity_at,
        marked_as_unread
      )
      VALUES ${rows.join(',')}
      `,
      values,
    );

    await runner.query(`
    UPDATE inbox_threads t
    JOIN tmp_inbox_update new
      ON t.viewer_id = new.viewer_id
      AND t.thread_fbid = new.thread_fbid
    SET
      t.last_message_id = new.last_message_id,
      t.last_activity_at = new.last_activity_at,
      t.marked_as_unread = new.marked_as_unread,
      t.updated_at = NOW()
    WHERE
      t.last_message_id IS NULL
      OR t.last_message_id < new.last_message_id
      OR (
      t.last_message_id = new.last_message_id
      AND t.last_activity_at < new.last_activity_at
    )
  `);
  }
  /* =====================================================
   * USER ACTIONS
   * ===================================================== */
  async markAsUnread(
    viewerId: string,
    threadFbid: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    await runner.query(
      `
      UPDATE inbox_threads
      SET marked_as_unread = true, updated_at = NOW()
      WHERE viewer_id = ? AND thread_fbid = ?
    `,
      [viewerId, threadFbid],
    );
  }

  async markAsRead(
    viewerId: string,
    threadFbid: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    await runner.query(
      `
      UPDATE inbox_threads
      SET marked_as_unread = false, updated_at = NOW()
      WHERE viewer_id = ? AND thread_fbid = ?
      `,
      [viewerId, threadFbid],
    );
  }

  async markAsReadThrough(
    viewerId: string,
    threadFbid: string,
    messageId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    await runner.query(
      `
      UPDATE inbox_threads
      SET marked_as_unread = false, updated_at = NOW()
      WHERE viewer_id = ?
        AND thread_fbid = ?
        AND last_message_id = ?
      `,
      [viewerId, threadFbid, messageId],
    );
  }

  async setPinned(
    viewerId: string,
    threadFbid: string,
    pinned: boolean,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    await runner.query(
      `
      UPDATE inbox_threads
      SET
        pinned = ?,
        pinned_at = CASE WHEN ? = true THEN NOW() ELSE NULL END,
        updated_at = NOW()
      WHERE viewer_id = ? AND thread_fbid = ?
    `,
      [pinned, pinned, viewerId, threadFbid],
    );
  }

  async setMuted(
    viewerId: string,
    threadFbid: string,
    muted: boolean,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    await runner.query(
      `
      UPDATE inbox_threads
      SET muted = ?, updated_at = NOW()
      WHERE viewer_id = ? AND thread_fbid = ?
    `,
      [muted, viewerId, threadFbid],
    );
  }

  async setArchived(
    viewerId: string,
    threadFbid: string,
    archived: boolean,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    await runner.query(
      `
      UPDATE inbox_threads
      SET archived = ?, updated_at = NOW()
      WHERE viewer_id = ? AND thread_fbid = ?
    `,
      [archived, viewerId, threadFbid],
    );
  }
}
