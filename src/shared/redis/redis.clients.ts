import Redis, { Redis as RedisClient, RedisOptions } from 'ioredis';
import { NestConfigService } from '../config/config.service';
import { RedisClients } from 'src/types/redis/redis.types';

const RedisCtor = Redis as new (options: RedisOptions) => RedisClient;

/**
 * Create a safe Redis client with full lifecycle logging
 */
export const createSafeRedisClient = (
  name: string,
  options: RedisOptions,
): RedisClient => {
  const client = new RedisCtor({
    ...options,

    // 🔥 quan trọng cho production
    enableReadyCheck: false,
    maxRetriesPerRequest: null,

    retryStrategy: (times: number) => {
      if (times > 20) {
        console.error(`[Redis:${name}] retry too many times, stop retry`);
        return null;
      }

      const delay = Math.min(times * 50, 2000);
      console.warn(`[Redis:${name}] retry #${times}, delay ${delay}ms`);
      return delay;
    },
  });

  // ✅ BẮT BUỘC: tránh crash
  client.on('error', (err: any) => {
    console.error(`[Redis:${name}] error`, {
      message: err?.message,
      code: err?.code,
    });
  });

  // ✅ lifecycle logs
  client.on('connect', () => {
    console.log(`[Redis:${name}] connected`);
  });

  client.on('ready', () => {
    console.log(`[Redis:${name}] ready`);
  });

  client.on('reconnecting', () => {
    console.warn(`[Redis:${name}] reconnecting...`);
  });

  client.on('close', () => {
    console.warn(`[Redis:${name}] connection closed`);
  });

  client.on('end', () => {
    console.error(`[Redis:${name}] connection ended`);
  });

  return client;
};

/**
 * Create all Redis clients
 */
export const createRedisClients = (
  configService: NestConfigService,
): RedisClients => {
  const { host, port, password, dbs } = configService.redis;

  const baseOptions: RedisOptions = {
    host: host === 'localhost' ? '127.0.0.1' : host, // 🔥 tránh IPv6 bug
    port,
    password,
  };

  return {
    cacheRedis: createSafeRedisClient('cache', {
      ...baseOptions,
      db: dbs.cache,
    }),

    sessionRedis: createSafeRedisClient('session', {
      ...baseOptions,
      db: dbs.session,
    }),

    queueRedis: createSafeRedisClient('queue', {
      ...baseOptions,
      db: dbs.queue,
    }),

    tokenRedis: createSafeRedisClient('token', {
      ...baseOptions,
      db: dbs.token,
    }),
  };
};
