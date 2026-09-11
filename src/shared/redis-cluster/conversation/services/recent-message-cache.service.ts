import { Injectable } from '@nestjs/common';

import { AppLogger } from '@/shared/logger/applogger';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';
import { MessageSqlRow } from '@/types/typeModel/message-raw';

export interface RecentMessageCacheLookup {
  rows: MessageSqlRow[] | null;
  generation: string;
}

const SET_IF_GENERATION_MATCHES_LUA = `
local current = redis.call('GET', KEYS[1]) or '0'
if current ~= ARGV[1] then
  return 0
end
redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
return 1
`;

const DEFAULT_PAGE_TTL_SECONDS = 15 * 60;
const MIN_PAGE_TTL_SECONDS = 60;
const MAX_PAGE_TTL_SECONDS = 60 * 60;

function getPageTtlSeconds(): number {
  const configured = Number(
    process.env.RECENT_MESSAGE_CACHE_TTL_SECONDS ?? DEFAULT_PAGE_TTL_SECONDS,
  );

  if (
    !Number.isInteger(configured) ||
    configured < MIN_PAGE_TTL_SECONDS ||
    configured > MAX_PAGE_TTL_SECONDS
  ) {
    return DEFAULT_PAGE_TTL_SECONDS;
  }

  return configured;
}

@Injectable()
export class RecentMessageCacheService {
  // Generation and page keys share {conversationId}, keeping Lua in one slot.
  private readonly pageTtlSeconds = getPageTtlSeconds();
  private readonly generationTtlSeconds = 7 * 24 * 60 * 60;
  private readonly maxCachedPayloadBytes = 512 * 1024;

  constructor(
    private readonly redis: RedisClusterService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RecentMessageCacheService.name);
  }

  /**
   * Cache only the first (latest) page. Cursor pages remain in MySQL so Redis
   * memory stays bounded even for conversations with a very long history.
   */
  async getLatest(
    conversationId: string,
    fetchLimit: number,
  ): Promise<RecentMessageCacheLookup> {
    const generationKey =
      WsRedisKeys.recentMessagesGenerationKey(conversationId);

    try {
      const generation = (await this.redis.raw.get(generationKey)) ?? '0';
      const pageKey = WsRedisKeys.recentMessagesPageKey(
        conversationId,
        generation,
        fetchLimit,
      );

      // Re-read the generation with the page. If a committed write happened
      // between the two reads, never serve the old generation.
      const results = await this.redis
        .pipeline()
        .get(pageKey)
        .get(generationKey)
        .exec();
      const serialized = results?.[0]?.[1];
      const currentGeneration = (results?.[1]?.[1] as string | null) ?? '0';

      if (currentGeneration !== generation || typeof serialized !== 'string') {
        return { rows: null, generation: currentGeneration };
      }

      const parsed: unknown = JSON.parse(serialized);
      if (!Array.isArray(parsed)) {
        return { rows: null, generation: currentGeneration };
      }

      return {
        rows: parsed as MessageSqlRow[],
        generation: currentGeneration,
      };
    } catch (error) {
      this.logger.warn('Recent message cache read failed; using MySQL', {
        error,
        conversationId,
      });
      return { rows: null, generation: '0' };
    }
  }

  async setLatestIfGenerationMatches(
    conversationId: string,
    fetchLimit: number,
    generation: string,
    rows: MessageSqlRow[],
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(rows);
      if (Buffer.byteLength(serialized, 'utf8') > this.maxCachedPayloadBytes) {
        this.logger.debug('Recent message page is too large to cache', {
          conversationId,
          fetchLimit,
        });
        return;
      }

      const generationKey =
        WsRedisKeys.recentMessagesGenerationKey(conversationId);
      const pageKey = WsRedisKeys.recentMessagesPageKey(
        conversationId,
        generation,
        fetchLimit,
      );

      await this.redis.raw.eval(
        SET_IF_GENERATION_MATCHES_LUA,
        2,
        generationKey,
        pageKey,
        generation,
        serialized,
        String(this.pageTtlSeconds),
      );
    } catch (error) {
      this.logger.warn('Recent message cache write failed', {
        error,
        conversationId,
      });
    }
  }

  /** Call only after the database transaction has committed. */
  async invalidate(conversationId: string): Promise<void> {
    const generationKey =
      WsRedisKeys.recentMessagesGenerationKey(conversationId);

    try {
      await this.redis
        .multi()
        .incr(generationKey)
        .expire(generationKey, this.generationTtlSeconds)
        .exec();
    } catch (error) {
      // Cache invalidation must never make a successfully persisted message fail.
      this.logger.warn('Recent message cache invalidation failed', {
        error,
        conversationId,
      });
    }
  }
}
