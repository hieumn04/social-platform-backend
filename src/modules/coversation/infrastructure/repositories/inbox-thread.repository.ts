import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import {
  IgThreadPreviewRow,
  InboxThreadRaw,
  InboxThreadSqlRow,
  ThreadRaw,
  ThreadResponse,
} from '@/types/typeModel/inbox-thread.raw-row';
import { InboxThreadRawMapper } from '@/modules/coversation/infrastructure/mapper/inbox-thread.mapper';
import { InboxFolder } from '@/shared/enums/roomStatus.enum';
import { ResolveThreadResult } from '@/types/typeModel/inbox-thread';

@Injectable()
export class TypeormInboxThreadRepository {
  private readonly MAX_LIMIT = 50;

  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TypeormInboxThreadRepository.name);
  }

  /* -------------------------------------------------------------------------- */
  /*                                    helpers                                 */
  /* -------------------------------------------------------------------------- */

  private buildInClause(values: string[]) {
    return values.map(() => '?').join(',');
  }

  private clampLimit(limit: number) {
    return Math.min(limit, this.MAX_LIMIT);
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    try {
      return await this.dataSource.query(sql, params);
    } catch (err) {
      this.logger.error('InboxThreadRepository query failed', {
        error: err,
      });
      throw err;
    }
  }

  async getUnreadThreadSnapshot(
    viewerId: string,
    conversationId?: string,
  ): Promise<{
    unreadThreadCount: number;
    threadUnread: boolean;
    threadFbid: string | null;
  }> {
    const rows = await this.queryRows<{
      unread_thread_count: string | number | null;
      thread_unread: string | number | null;
      thread_fbid: string | number | null;
    }>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN marked_as_unread = 1 THEN 1 ELSE 0 END), 0)
          AS unread_thread_count,
        COALESCE(MAX(CASE
          WHEN conversation_id = ? THEN marked_as_unread
          ELSE 0
        END), 0) AS thread_unread,
        MAX(CASE
          WHEN conversation_id = ? THEN thread_fbid
          ELSE NULL
        END) AS thread_fbid
      FROM inbox_threads
      WHERE viewer_id = ?
        AND folder = 'PRIMARY'
        AND system_folder = 'INBOX'
      `,
      [conversationId ?? '', conversationId ?? '', viewerId],
    );
    const row = rows[0];
    const unreadThreadCount = Number(row?.unread_thread_count ?? 0);

    return {
      unreadThreadCount: Number.isFinite(unreadThreadCount)
        ? Math.max(0, unreadThreadCount)
        : 0,
      threadUnread: Number(row?.thread_unread ?? 0) === 1,
      threadFbid: row?.thread_fbid == null ? null : String(row.thread_fbid),
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                 single thread                              */
  /* -------------------------------------------------------------------------- */

  async findByViewerAndThreadFbId(
    viewerId: string,
    threadFbid: string,
  ): Promise<IgThreadPreviewRow | null> {
    const rows = await this.queryRows<IgThreadPreviewRow>(
      `
  SELECT
    thread_fbid,
    thread_key,
    thread_subtype,
    reachability_status,
    display_avatar_url,
    display_name,
    last_activity_at,
    last_message_id,
    marked_as_unread,
    pinned,
    muted,
    system_folder,
    conversation_id
  FROM inbox_threads
  WHERE viewer_id = ?
  AND thread_fbid = ?
  LIMIT 1
  `,
      [viewerId, threadFbid],
    );

    if (!rows.length) return null;

    return rows[0];
  }

  async getConversationIdByViewerAndThreadFbId(
    viewerId: string,
    threadFbid: string,
  ): Promise<string | null> {
    const rows = await this.queryRows<{ conversation_id: string }>(
      `
    SELECT conversation_id
    FROM inbox_threads
    WHERE viewer_id = ?
      AND thread_fbid = ?
    LIMIT 1
    `,
      [viewerId, threadFbid],
    );

    if (!rows.length) return null;

    return rows[0].conversation_id;
  }

  async getThreadFbidByConversationIdAndViewerId(
    conversationId: string,
    viewerId: string,
  ): Promise<string | null> {
    const rows = await this.queryRows<{ thread_fbid: string }>(
      `
      SELECT thread_fbid
      FROM inbox_threads
      WHERE conversation_id = ?
        AND viewer_id = ?
      LIMIT 1
      `,
      [conversationId, viewerId],
    );

    if (!rows.length) return null;

    return rows[0].thread_fbid;
  }

  async resolveThread(
    viewerId: string,
    threadKey: string,
  ): Promise<ResolveThreadResult> {
    const rows = await this.queryRows<InboxThreadSqlRow>(
      `
    SELECT thread_fbid, conversation_id, thread_key
    FROM inbox_threads
    WHERE viewer_id = ?
    AND thread_key = ?
    LIMIT 1
    `,
      [viewerId, threadKey],
    );

    if (!rows.length) {
      return {
        threadFbid: null,
        threadKey,
        exists: false,
      };
    }

    return {
      threadFbid: rows[0].thread_fbid,
      conversationId: rows[0].conversation_id,
      threadKey: rows[0].thread_key,
      exists: true,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                              multiple threads                              */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                               latest threads                               */
  /* -------------------------------------------------------------------------- */

  async getThreadsByFbids(
    userId: string,
    threadFbids: string[],
  ): Promise<InboxThreadSqlRow[]> {
    if (!threadFbids.length) return [];

    const inClause = this.buildInClause(threadFbids);
    const rows = await this.queryRows<InboxThreadSqlRow>(
      `
      SELECT
        thread_fbid,
        thread_key,
        thread_subtype,
        last_activity_at,
        display_avatar_url,
        display_name,
        marked_as_unread,
        pinned,
        conversation_id,
        last_message_id,
        marked_as_unread,
        reachability_status,
        muted
      FROM inbox_threads
      WHERE viewer_id = ?
      AND thread_fbid IN (${inClause})
      `,
      [userId, ...threadFbids],
    );

    return rows;
  }

  async getLatestThreads(
    userId: string,
    limit = 20,
  ): Promise<InboxThreadSqlRow[]> {
    const safeLimit = this.clampLimit(limit);

    const rows = await this.queryRows<InboxThreadSqlRow>(
      `
      SELECT
        thread_fbid,
        thread_key,
        thread_subtype,
        last_activity_at,
        display_avatar_url,
        display_name,
        marked_as_unread,
        pinned,
        conversation_id,
        last_message_id,
        marked_as_unread,
        reachability_status,
        muted
      FROM inbox_threads
      WHERE viewer_id = ?
      AND folder = "PRIMARY"
      AND system_folder = "INBOX"
      ORDER BY pinned DESC, last_activity_at DESC
      LIMIT ?
      `,
      [userId, safeLimit],
    );

    return rows;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 folder query                               */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                                cursor paging                               */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                                   update                                   */
  /* -------------------------------------------------------------------------- */

  async archiveThread(threadId: string, archived: boolean): Promise<void> {
    await this.queryRows(
      `
      UPDATE inbox_threads
      SET archived = ?
      WHERE inbox_thread_id = ?
      `,
      [archived, threadId],
    );
  }

  async setPinned(threadId: string, pinned: boolean): Promise<void> {
    await this.queryRows(
      `
      UPDATE inbox_threads
      SET pinned = ?,
          pinned_at = CASE WHEN ? = TRUE THEN NOW() ELSE NULL END
      WHERE inbox_thread_id = ?
      `,
      [pinned, pinned, threadId],
    );
  }

  async setMuted(threadId: string, muted: boolean): Promise<void> {
    await this.queryRows(
      `
      UPDATE inbox_threads
      SET muted = ?
      WHERE inbox_thread_id = ?
      `,
      [muted, threadId],
    );
  }
}
