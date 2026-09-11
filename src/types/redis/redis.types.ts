import { Redis as RedisClient } from 'ioredis';

export interface RedisDbs {
  cache: number;
  session: number;
  queue: number;
  token: number;
}

export interface MultiRedisConfig {
  host: string;
  port: number;
  password?: string;
  dbs: RedisDbs;
}

export type RedisClients = {
  cacheRedis: RedisClient;
  sessionRedis: RedisClient;
  queueRedis: RedisClient;
  tokenRedis: RedisClient;
};

export interface RedisSetOptions {
  key: string;
  value: any;
  ttl?: number | undefined;
  type?: keyof RedisClients;
}

export interface RedisRateLimitPayload {
  remaining: number;
  resetTime: string;
  totalHits: number;
}

export interface HashSetOptions {
  key: string;
  fields: Record<string, string | number>;
  ttlSeconds?: number;
}
