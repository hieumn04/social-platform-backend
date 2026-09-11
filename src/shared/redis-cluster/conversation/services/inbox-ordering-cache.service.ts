import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';
import { UPDATE_INBOX_ORDER_LUA } from '../scripts/update-inbox-order.lua';
import { AppLogger } from '@/shared/logger/applogger';

@Injectable()
export class InboxOrderingCacheService implements OnModuleInit {
  /**
   * SHA được cấp bởi Redis sau lệnh SCRIPT LOAD.
   * null = chưa load hoặc load thất bại -> fallback sang EVAL.
   */
  private scriptSha: string | null = null;

  constructor(
    private readonly redis: RedisClusterService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(InboxOrderingCacheService.name);
  }

  /**
   * Pre-load Lua script vào Redis khi module khởi động.
   * SCRIPT LOAD trả về SHA40 thực sự -> dùng cho mọi EVALSHA sau đó.
   */
  async onModuleInit(): Promise<void> {
    try {
      const cluster = await this.redis.getCluster();
      const sha = (await cluster.script(
        'LOAD',
        UPDATE_INBOX_ORDER_LUA.trim(),
      )) as string;
      this.scriptSha = sha;
      this.logger.log(`Inbox order Lua script loaded. SHA=${sha}`);
    } catch (err) {
      this.logger.warn('Failed to preload Lua script — will fallback to EVAL on each call', { error: err });
    }
  }

  /**
   * HOT PATH: Cập nhật thứ tự inbox của user khi có tin nhắn mới (chỉ 1 network RTT dùng Lua)
   */
  async updateInboxOrderOnActivity(params: {
    userId: string;
    threadId: string; // thread_fbid
    timestampMs: number;
  }): Promise<void> {
    const { userId, threadId, timestampMs } = params;
    const pinnedKey = WsRedisKeys.userPinnedInboxKey(userId);
    const normalKey = WsRedisKeys.userInboxKey(userId);
    try {
      if (this.scriptSha) {
        // 1. Happy path: EVALSHA (1 RTT, script đã sẵn trên Redis)
        await this.redis.raw.evalsha(
          this.scriptSha,
          2,
          pinnedKey,
          normalKey,
          threadId,
          timestampMs.toString(),
        );
      } else {
        // 2. SHA chưa sẵn sàng (startup race) → EVAL trực tiếp
        await this._evalScript(pinnedKey, normalKey, threadId, timestampMs);
      }
    } catch (err: any) {
      if (err?.message?.includes('NOSCRIPT')) {
        // 3. Redis đã flush script cache (e.g. restart) → EVAL + reload SHA
        this.logger.debug('NOSCRIPT error, falling back to EVAL and reloading SHA');
        await this._evalScript(pinnedKey, normalKey, threadId, timestampMs);
        // Reload SHA không đồng bộ, không block
        void this._reloadSha();
      } else {
        this.logger.warn('Failed to update inbox order', {
          error: err,
          userId,
          threadId,
        });
      }
    }
  }

  private async _evalScript(
    pinnedKey: string,
    normalKey: string,
    threadId: string,
    timestampMs: number,
  ): Promise<void> {
    await this.redis.raw.eval(
      UPDATE_INBOX_ORDER_LUA.trim(),
      2,
      pinnedKey,
      normalKey,
      threadId,
      timestampMs.toString(),
    );
  }

  private async _reloadSha(): Promise<void> {
    try {
      const sha = await this.redis.raw.script('LOAD', UPDATE_INBOX_ORDER_LUA.trim()) as string;
      this.scriptSha = sha;
      this.logger.log(`Inbox order Lua script re-loaded. SHA=${sha}`);
    } catch (err) {
      this.logger.warn('Failed to reload Lua script SHA', { error: err });
    }
  }

  /**
   * Lấy danh sách thread_fbid đã gộp và khử trùng lặp từ 2 ZSET
   */
  async getInboxThreadsPaged(userId: string, limit = 20): Promise<string[]> {
    const pinnedKey = WsRedisKeys.userPinnedInboxKey(userId);
    const normalKey = WsRedisKeys.userInboxKey(userId);

    try {
      // ZRANGE REV để sắp xếp mới nhất lên đầu
      const [pinned, normal] = await Promise.all([
        this.redis.raw.zrange(pinnedKey, 0, limit - 1, 'REV'),
        this.redis.raw.zrange(normalKey, 0, limit - 1, 'REV'),
      ]);

      const pinnedSet = new Set(pinned);
      const merged = [
        ...pinned,
        ...normal.filter((id) => !pinnedSet.has(id)),
      ];

      return merged;
    } catch (err) {
      this.logger.error('Failed to fetch inbox threads from cache', {
        error: err,
        userId,
      });
      return [];
    }
  }

  /**
   * Lấy thông tin tóm tắt của thread từ Redis HASH
   */
  async getThreadSummary(threadFbid: string): Promise<Record<string, string> | null> {
    const summaryKey = WsRedisKeys.threadSummaryKey(threadFbid);
    try {
      const summary = await this.redis.raw.hgetall(summaryKey);
      if (!summary || !Object.keys(summary).length) {
        return null;
      }
      return summary;
    } catch (err) {
      this.logger.warn('Failed to get thread summary cache', {
        error: err,
        threadFbid,
      });
      return null;
    }
  }

  /**
   * Lưu thông tin tóm tắt của thread vào Redis HASH
   */
  async setThreadSummary(threadFbid: string, thread: any): Promise<void> {
    const summaryKey = WsRedisKeys.threadSummaryKey(threadFbid);
    const summaryObj = this.serializeSummary(thread);
    try {
      await this.redis.raw.hset(summaryKey, summaryObj);
      await this.redis.raw.expire(summaryKey, 60 * 60 * 24); // 24 hours TTL
    } catch (err) {
      this.logger.warn('Failed to set thread summary cache', {
        error: err,
        threadFbid,
      });
    }
  }

  /**
   * Làm ấm Cache (Warm-up) đồng thời 2 ZSET và HASH tóm tắt từ dữ liệu DB
   */
  async warmUpUserInbox(
    userId: string,
    threads: any[],
    options?: { resetInboxLists?: boolean },
  ): Promise<void> {
    if (!threads || !threads.length) return;

    const pinnedKey = WsRedisKeys.userPinnedInboxKey(userId);
    const normalKey = WsRedisKeys.userInboxKey(userId);
    const inboxPipe = this.redis.pipeline();
    const summaryPipelines = [];
    const shouldResetInboxLists = options?.resetInboxLists ?? true;

    if (shouldResetInboxLists) {
      inboxPipe.del(pinnedKey);
      inboxPipe.del(normalKey);
    }

    for (const thread of threads) {
      const threadFbid = thread.thread_fbid;
      if (!threadFbid) continue;

      const score = thread.last_activity_at
        ? new Date(thread.last_activity_at).getTime()
        : Date.now();

      if (thread.pinned) {
        inboxPipe.zadd(pinnedKey, score, threadFbid);
      } else {
        inboxPipe.zadd(normalKey, score, threadFbid);
      }

      const summaryKey = WsRedisKeys.threadSummaryKey(threadFbid);
      const summaryObj = this.serializeSummary(thread);
      const summaryPipe = this.redis.pipeline();
      summaryPipe.del(summaryKey);
      summaryPipe.hset(summaryKey, summaryObj);
      summaryPipe.expire(summaryKey, 60 * 60 * 24);
      summaryPipelines.push(summaryPipe.exec());
    }

    inboxPipe.expire(pinnedKey, 60 * 60 * 24);
    inboxPipe.expire(normalKey, 60 * 60 * 24);

    try {
      await inboxPipe.exec();
      await Promise.all(summaryPipelines);
    } catch (err) {
      this.logger.error('Failed to warm up user inbox cache', {
        error: err,
        userId,
      });
    }
  }

  /**
   * Map từ HASH summary thành object giống DB raw row
   */
  deserializeSummary(summary: Record<string, string>): any {
    return {
      thread_fbid: summary.thread_fbid,
      thread_key: summary.thread_key,
      thread_subtype: summary.thread_subtype,
      display_avatar_url: summary.display_avatar_url || null,
      display_name: summary.display_name || null,
      last_message_id: summary.last_message_id || null,
      reachability_status: summary.reachability_status ? parseInt(summary.reachability_status) : null,
      conversation_id: summary.conversation_id,
      pinned: summary.pinned === '1',
      muted: summary.muted === '1',
      marked_as_unread: summary.marked_as_unread === '1',
      last_activity_at: summary.last_activity_at !== '0'
        ? new Date(parseInt(summary.last_activity_at))
        : null,
    };
  }

  private serializeSummary(thread: any): Record<string, string> {
    const summary: Record<string, string> = {};
    const fields = [
      'thread_fbid',
      'thread_key',
      'thread_subtype',
      'display_avatar_url',
      'display_name',
      'last_message_id',
      'reachability_status',
      'conversation_id',
    ];

    for (const field of fields) {
      if (thread[field] !== null && thread[field] !== undefined) {
        summary[field] = thread[field].toString();
      } else {
        summary[field] = '';
      }
    }

    summary['pinned'] = thread.pinned ? '1' : '0';
    summary['muted'] = thread.muted ? '1' : '0';
    summary['marked_as_unread'] = thread.marked_as_unread ? '1' : '0';
    summary['last_activity_at'] = thread.last_activity_at
      ? new Date(thread.last_activity_at).getTime().toString()
      : '0';

    return summary;
  }
}
