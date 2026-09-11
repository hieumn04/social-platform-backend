import { Injectable } from '@nestjs/common';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';

const WATERMARK_TTL_SECONDS = 60 * 60 * 24 * 7;

const ADVANCE_DELIVERY_LUA = `
local current = redis.call('HGET', KEYS[1], ARGV[1])

if current and tonumber(current) >= tonumber(ARGV[2]) then
  return 0
end

redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]))
return 1
`;

const ADVANCE_READ_LUA = `
local readField = ARGV[1]
local deliveryField = ARGV[2]
local timestamp = ARGV[3]
local ttl = tonumber(ARGV[4])

local currentRead = redis.call('HGET', KEYS[1], readField)

local updated = 0

if (not currentRead) or tonumber(currentRead) < tonumber(timestamp) then
  redis.call('HSET', KEYS[1], readField, timestamp)
  updated = 1
end

local currentDelivery = redis.call('HGET', KEYS[1], deliveryField)

if (not currentDelivery) or tonumber(currentDelivery) < tonumber(timestamp) then
  redis.call('HSET', KEYS[1], deliveryField, timestamp)
end

redis.call('EXPIRE', KEYS[1], ttl)
return updated
`;

export interface WatermarkEntry {
  participantId: string;
  deliveryWatermarkTimestampMs: string;
  readWatermarkTimestampMs: string;
}

@Injectable()
export class WatermarkCacheService {
  constructor(private readonly redis: RedisClusterService) { }

  async advanceRead(
    threadFbid: string,
    participantId: string,
    timestampMs: string,
  ): Promise<boolean> {
    const key = WsRedisKeys.watermarkKey(threadFbid);
    const readField = `${participantId}:read`;
    const deliveryField = `${participantId}:delivery`;

    const result = await this.redis.raw.eval(
      ADVANCE_READ_LUA,
      1,
      key,
      readField,
      deliveryField,
      timestampMs,
      String(WATERMARK_TTL_SECONDS),
    );

    return Number(result) === 1;
  }

  async advanceDelivery(
    threadFbid: string,
    participantId: string,
    timestampMs: string,
  ): Promise<void> {
    const key = WsRedisKeys.watermarkKey(threadFbid);
    const field = `${participantId}:delivery`;

    await this.redis.raw.eval(
      ADVANCE_DELIVERY_LUA,
      1,
      key,
      field,
      timestampMs,
      String(WATERMARK_TTL_SECONDS),
    );
  }

  async getAll(threadFbid: string): Promise<WatermarkEntry[]> {
    const key = WsRedisKeys.watermarkKey(threadFbid);
    const raw = await this.redis.raw.hgetall(key);

    if (!raw || Object.keys(raw).length === 0) return [];

    const map = new Map<string, Partial<WatermarkEntry>>();

    for (const [field, value] of Object.entries(raw)) {
      const colonIdx = field.lastIndexOf(':');

      if (colonIdx === -1) continue;

      const participantId = field.slice(0, colonIdx);
      const type = field.slice(colonIdx + 1);

      if (!map.has(participantId)) {
        map.set(participantId, {
          participantId,
          deliveryWatermarkTimestampMs: '0',
          readWatermarkTimestampMs: '0',
        });
      }

      const entry = map.get(participantId)!;

      if (type === 'delivery') {
        entry.deliveryWatermarkTimestampMs = value;
      }

      if (type === 'read') {
        entry.readWatermarkTimestampMs = value;
      }
    }

    return Array.from(map.values()) as WatermarkEntry[];
  }

  async getOne(
    threadFbid: string,
    participantId: string,
  ): Promise<{
    deliveryWatermarkTimestampMs: string;
    readWatermarkTimestampMs: string;
  }> {
    const key = WsRedisKeys.watermarkKey(threadFbid);

    const [delivery, read] = await Promise.all([
      this.redis.raw.hget(key, `${participantId}:delivery`),
      this.redis.raw.hget(key, `${participantId}:read`),
    ]);

    return {
      deliveryWatermarkTimestampMs: delivery ?? '0',
      readWatermarkTimestampMs: read ?? '0',
    };
  }

  async getManyReadTimestamps(
    items: Array<{ threadFbid: string; participantId: string }>,
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    if (!items.length) {
      return result;
    }

    // Cluster-safe: keys from different threadFbids land in different slots,
    // so we must not put them into a single pipeline().
    const responses = await Promise.allSettled(
      items.map((item) =>
        this.redis.raw.hget(
          WsRedisKeys.watermarkKey(item.threadFbid),
          `${item.participantId}:read`,
        ),
      ),
    );

    items.forEach((item, index) => {
      const response = responses[index];
      const value = response.status === 'fulfilled' ? response.value : null;

      if (typeof value === 'string' && value.length > 0) {
        result.set(item.threadFbid, value);
      }
    });

    return result;
  }

  async warmUp(threadFbid: string, entries: WatermarkEntry[]): Promise<void> {
    if (!entries.length) return;

    const key = WsRedisKeys.watermarkKey(threadFbid);
    const fields: Record<string, string> = {};

    for (const e of entries) {
      fields[`${e.participantId}:delivery`] =
        e.deliveryWatermarkTimestampMs;
      fields[`${e.participantId}:read`] = e.readWatermarkTimestampMs;
    }

    await this.redis.raw
      .multi()
      .hset(key, fields)
      .expire(key, WATERMARK_TTL_SECONDS)
      .exec();
  }

  async invalidate(threadFbid: string): Promise<void> {
    await this.redis.raw.del(WsRedisKeys.watermarkKey(threadFbid));
  }
}
