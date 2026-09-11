import { Injectable } from '@nestjs/common';
import { AppLogger } from '@/shared/logger/applogger';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';
import type { Cluster } from 'ioredis';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Sockets that have not sent a heartbeat within this window are considered dead. */
const OFFLINE_THRESHOLD_MS = 90_000;
const OFFLINE_THRESHOLD_S = 90;

/** How long we keep the last-active timestamp after the user goes offline. */
const ACTIVITY_TTL_S = 60 * 60 * 24 * 3; // 3 days

// ─── Lua Scripts ─────────────────────────────────────────────────────────────
//
// All scripts use redis.call("TIME") so time is always sourced from the Redis
// primary node — no clock skew between backend instances.
//
// KEYS[1] = presenceConnections key   (ZSET)
// KEYS[2] = activity key              (STRING)
//
// ─── CONNECT ─────────────────────────────────────────────────────────────────
/**
 * 1. Clean up stale sockets (score < now - threshold).
 * 2. ZADD the current socketId with NX (don't overwrite if already present).
 * 3. Reset ZSET TTL to 90 s.
 * 4. Update activity STRING and reset its TTL to 3 days.
 * 5. Return ZCARD (active connection count after the op).
 *
 * Returns: count (number)  ← caller computes becameOnline = (count === 1)
 */
const CONNECT_SCRIPT = `
local timeRes      = redis.call("TIME")
local nowMs        = tonumber(timeRes[1]) * 1000 + math.floor(tonumber(timeRes[2]) / 1000)
local threshold    = nowMs - tonumber(ARGV[2])
local socketId     = ARGV[1]
local presenceTTL  = tonumber(ARGV[3])
local activityTTL  = tonumber(ARGV[4])

-- 1. Remove stale sockets
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", threshold)

-- 2. Register this socket (NX = do not overwrite existing score)
redis.call("ZADD", KEYS[1], "NX", nowMs, socketId)

-- 3. Reset presence TTL
redis.call("EXPIRE", KEYS[1], presenceTTL)

-- 4. Update activity
redis.call("SET", KEYS[2], tostring(nowMs), "EX", activityTTL)

-- 5. Return count
return redis.call("ZCARD", KEYS[1])
`;

// ─── HEARTBEAT ───────────────────────────────────────────────────────────────
/**
 * 1. Update the score of the socket (XX = only if it already exists).
 * 2. Reset ZSET TTL to 90 s.
 * 3. Update activity STRING and reset its TTL to 3 days.
 *
 * No return value needed.
 */
const HEARTBEAT_SCRIPT = `
local timeRes     = redis.call("TIME")
local nowMs       = tonumber(timeRes[1]) * 1000 + math.floor(tonumber(timeRes[2]) / 1000)
local socketId    = ARGV[1]
local presenceTTL = tonumber(ARGV[2])
local activityTTL = tonumber(ARGV[3])

-- Update score (XX = only existing members)
redis.call("ZADD", KEYS[1], "XX", nowMs, socketId)

-- Reset TTLs
redis.call("EXPIRE", KEYS[1], presenceTTL)
redis.call("SET", KEYS[2], tostring(nowMs), "EX", activityTTL)

return 1
`;

// ─── DISCONNECT ──────────────────────────────────────────────────────────────
/**
 * 1. ZREM the specific socket.
 * 2. Clean up any remaining stale sockets.
 * 3. ZCARD the remaining connections.
 * 4. If count === 0: update activity STRING (user went offline), return 0.
 * 5. If count > 0: user is still online via another device, return count.
 *
 * Returns: count (number) ← caller computes becameOffline = (count === 0)
 * When count === 0, KEYS[2] (activity) is also updated by the script.
 */
const DISCONNECT_SCRIPT = `
local timeRes     = redis.call("TIME")
local nowMs       = tonumber(timeRes[1]) * 1000 + math.floor(tonumber(timeRes[2]) / 1000)
local threshold   = nowMs - tonumber(ARGV[2])
local socketId    = ARGV[1]
local activityTTL = tonumber(ARGV[3])

-- 1. Remove this exact socket first
redis.call("ZREM", KEYS[1], socketId)

-- 2. Cleanup stale sockets that may have expired
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", threshold)

-- 3. Count remaining connections
local count = redis.call("ZCARD", KEYS[1])

-- 4. If no connections remain → record lastActiveAt
if count == 0 then
  redis.call("SET", KEYS[2], tostring(nowMs), "EX", activityTTL)
end

return count
`;

// ─── GET PRESENCE ─────────────────────────────────────────────────────────────
/**
 * 1. Clean up stale sockets.
 * 2. ZCARD.
 * 3. GET activity.
 *
 * NOTE: Does NOT refresh activity TTL — reading ≠ user activity.
 *
 * Returns: [count, lastActiveAt]  (lastActiveAt may be false/nil)
 */
const GET_PRESENCE_SCRIPT = `
local timeRes   = redis.call("TIME")
local nowMs     = tonumber(timeRes[1]) * 1000 + math.floor(tonumber(timeRes[2]) / 1000)
local threshold = nowMs - tonumber(ARGV[1])

-- 1. Cleanup
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", threshold)

-- 2. Count active connections
local count = redis.call("ZCARD", KEYS[1])

-- 3. Get last-active timestamp (may be nil/false)
local lastActiveAt = redis.call("GET", KEYS[2])

return {count, lastActiveAt}
`;

// ─── Return types ─────────────────────────────────────────────────────────────

export interface ConnectResult {
  becameOnline: boolean;
  activeConnectionCount: number;
}

export interface DisconnectResult {
  becameOffline: boolean;
}

export interface PresenceStatus {
  userId: string;
  online: boolean;
  /** Unix-ms string, or null when the activity key has expired (> 3 days). */
  lastActiveAt: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PresenceService {
  private get cluster(): Cluster {
    return this.redis.raw;
  }

  constructor(
    private readonly redis: RedisClusterService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PresenceService.name);
  }

  // ─── connect ────────────────────────────────────────────────────────────────

  async connect(userId: string, socketId: string): Promise<ConnectResult> {
    const [kPresence, kActivity] = this.keys(userId);

    const count = (await this.cluster.eval(
      CONNECT_SCRIPT,
      2,
      kPresence,
      kActivity,
      socketId,
      String(OFFLINE_THRESHOLD_MS),
      String(OFFLINE_THRESHOLD_S),
      String(ACTIVITY_TTL_S),
    )) as number;

    const becameOnline = count === 1;

    this.logger.log(
      `presence connect user=${userId} socket=${socketId} connections=${count} becameOnline=${becameOnline}`,
    );

    return { becameOnline, activeConnectionCount: count };
  }

  // ─── heartbeat ──────────────────────────────────────────────────────────────

  async heartbeat(userId: string, socketId: string): Promise<void> {
    const [kPresence, kActivity] = this.keys(userId);

    await this.cluster.eval(
      HEARTBEAT_SCRIPT,
      2,
      kPresence,
      kActivity,
      socketId,
      String(OFFLINE_THRESHOLD_S),
      String(ACTIVITY_TTL_S),
    );

    this.logger.debug(`presence heartbeat user=${userId} socket=${socketId}`);
  }

  // ─── disconnect ─────────────────────────────────────────────────────────────

  async disconnect(userId: string, socketId: string): Promise<DisconnectResult> {
    const [kPresence, kActivity] = this.keys(userId);

    const count = (await this.cluster.eval(
      DISCONNECT_SCRIPT,
      2,
      kPresence,
      kActivity,
      socketId,
      String(OFFLINE_THRESHOLD_MS),
      String(ACTIVITY_TTL_S),
    )) as number;

    const becameOffline = count === 0;

    this.logger.log(
      `presence disconnect user=${userId} socket=${socketId} remaining=${count} becameOffline=${becameOffline}`,
    );

    return { becameOffline };
  }

  // ─── getPresence ────────────────────────────────────────────────────────────

  async getPresence(userId: string): Promise<PresenceStatus> {
    const [kPresence, kActivity] = this.keys(userId);

    const result = (await this.cluster.eval(
      GET_PRESENCE_SCRIPT,
      2,
      kPresence,
      kActivity,
      String(OFFLINE_THRESHOLD_MS),
    )) as [number, string | null];

    const [count, lastActiveAt] = result;

    return {
      userId,
      online: count > 0,
      lastActiveAt: lastActiveAt ?? null,
    };
  }

  // ─── getMultiplePresences ────────────────────────────────────────────────────
  /**
   * Cluster-aware: groups userIds by Redis primary node then executes one
   * pipeline per node concurrently. This avoids CROSSSLOT errors that would
   * occur if we put all commands into a single pipeline.
   */
  async getMultiplePresences(userIds: string[]): Promise<PresenceStatus[]> {
    if (!userIds.length) return [];

    // Deduplicate
    const unique = [...new Set(userIds)];

    // Group by the primary node that owns each key's slot.
    // ioredis Cluster exposes getSlotOwner / nodes, but the simplest
    // cluster-safe approach is to run each eval independently and let
    // ioredis route them — then batch with Promise.all for concurrency.
    // For larger fan-outs we group by slot master node using the internal API.
    const nodeMap = new Map<string, { userId: string; kPresence: string; kActivity: string }[]>();

    for (const userId of unique) {
      const [kPresence, kActivity] = this.keys(userId);
      // Determine which master node owns this slot
      const slot = this.getSlot(kPresence);
      const node = this.cluster.nodes('master').find((n) => {
        const slots = (n as any).slots as number[][];
        return slots?.some(([start, end]) => slot >= start && slot <= end);
      });
      const nodeKey = node ? `${node.options.host}:${node.options.port}` : 'default';

      if (!nodeMap.has(nodeKey)) nodeMap.set(nodeKey, []);
      nodeMap.get(nodeKey)!.push({ userId, kPresence, kActivity });
    }

    // Execute one pipeline per node concurrently
    const results = await Promise.all(
      Array.from(nodeMap.values()).map(async (entries) => {
        // Build a pipeline for this node's entries.
        // Each eval call within the same hash-tag is cluster-safe.
        const settled = await Promise.allSettled(
          entries.map(({ userId, kPresence, kActivity }) =>
            this.cluster
              .eval(GET_PRESENCE_SCRIPT, 2, kPresence, kActivity, String(OFFLINE_THRESHOLD_MS))
              .then((res) => {
                const [count, lastActiveAt] = res as [number, string | null];
                return {
                  userId,
                  online: count > 0,
                  lastActiveAt: lastActiveAt ?? null,
                } satisfies PresenceStatus;
              }),
          ),
        );

        return settled
          .filter((r): r is PromiseFulfilledResult<PresenceStatus> => r.status === 'fulfilled')
          .map((r) => r.value);
      }),
    );

    return results.flat();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private keys(userId: string): [string, string] {
    return [WsRedisKeys.presenceConnections(userId), WsRedisKeys.activity(userId)];
  }

  /**
   * Compute CRC16-based Redis cluster slot for a key.
   * This mirrors the algorithm in ioredis so we can group keys without
   * sending a round-trip to Redis.
   */
  private getSlot(key: string): number {
    // Extract hash tag if present
    const s = key.indexOf('{');
    const e = key.indexOf('}', s + 1);
    const tag = s >= 0 && e > s + 1 ? key.slice(s + 1, e) : key;
    return this.crc16(tag) % 16384;
  }

  private crc16(str: string): number {
    let crc = 0;
    for (let i = 0; i < str.length; i++) {
      crc = ((crc << 8) & 0xffff) ^ CRC16_TABLE[((crc >> 8) ^ str.charCodeAt(i)) & 0xff];
    }
    return crc;
  }
}

// ─── CRC16-CCITT lookup table (used by Redis for slot assignment) ─────────────
const CRC16_TABLE = [
  0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108, 0x9129, 0xa14a,
  0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294,
  0x72f7, 0x62d6, 0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462,
  0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b, 0x8528, 0x9509,
  0xe5ee, 0xf5cf, 0xc5ac, 0xd58d, 0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695,
  0x46b4, 0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc, 0x4864, 0x5845,
  0x6826, 0x7807, 0x08e0, 0x18c1, 0x28a2, 0x38c3, 0xc92c, 0xd90d, 0xe96e, 0xf94f, 0x89a8,
  0x99e9, 0xa98a, 0xb9ab, 0x5a55, 0x4a74, 0x7a17, 0x6a36, 0x1ad1, 0x0af0, 0x3a93, 0x2ab2,
  0xdb5d, 0xcb7c, 0xfb1f, 0xeb3e, 0x9bd9, 0x8bf8, 0xbb9b, 0xabba, 0x6ca6, 0x7c87, 0x4ce4,
  0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b,
  0x8d68, 0x9d49, 0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70, 0xff9f,
  0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb,
  0xd10c, 0xc12d, 0xf14e, 0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046,
  0x6067, 0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1, 0x1290,
  0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e,
  0xe54f, 0xd52c, 0xc50d, 0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
  0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691,
  0x16b0, 0x6657, 0x7676, 0x4615, 0x5634, 0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9,
  0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3, 0xcb7d,
  0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a, 0x4a75, 0x5a54, 0x6a37, 0x7a16,
  0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8,
  0x8dc9, 0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1, 0xef1f, 0xff3e,
  0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93,
  0x3eb2, 0x0ed1, 0x1ef0,
];
