import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  HashSetOptions,
  RedisClients,
  RedisSetOptions,
} from 'src/types/redis/redis.types';

import type { ChainableCommander, Redis } from 'ioredis';
import { setRedisClients } from './helper/redis.utils';
import { parseHashResult } from 'src/helpers/object';
import { NestConfigService } from '@/shared/config/config.service';
import { createRedisClients } from '@/shared/redis/redis.clients';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private clients!: RedisClients;
  private readonly logger = new Logger(RedisService.name);
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  constructor(private readonly configService: NestConfigService) {
    this.readyPromise = new Promise((resolve) => (this.readyResolve = resolve));
  }

  checkRedis = async (name: string, client: Redis): Promise<void> => {
    try {
      const pong: string = await client.ping();
      if (pong !== 'PONG') throw new Error(`Unexpected response: ${pong}`);
      this.logger.log(` ${name} connected`);
    } catch (error) {
      this.logger.error(` ${name} failed to connect:`, error);
      throw error;
    }
  };
  async onModuleInit(): Promise<void> {
    this.clients = createRedisClients(this.configService);
    setRedisClients(this.clients);

    try {
      await Promise.all([
        this.checkRedis('Cache Redis', this.clients.cacheRedis),
        this.checkRedis('Session Redis', this.clients.sessionRedis),
        this.checkRedis('Queue Redis', this.clients.queueRedis),
        this.checkRedis('Token Redis', this.clients.tokenRedis),
      ]);
      this.logger.log(' All Redis clients connected successfully.');
      this.readyResolve();
    } catch (error) {
      this.logger.error(' Redis connection failed:', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await Promise.all(
        Object.values(this.clients).map((client) => client.quit()),
      );
      this.logger.log(' All Redis clients gracefully quit.');
    } catch (error) {
      this.logger.error('Redis connection failed:', error);
    }
  }

  async waitUntilReady(timeout = 25000): Promise<void> {
    return Promise.race([
      this.readyPromise,
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Redis not ready')), timeout),
      ),
    ]);
  }

  async getCache(): Promise<Redis> {
    await this.waitUntilReady(); // đợi clients được khởi tạo xong
    return this.clients.cacheRedis;
  }

  private getClient(type?: keyof RedisClients): Redis {
    return this.clients[type || 'cacheRedis'];
  }

  callRedis<T = any>(command: string, ...args: string[]): Promise<T> {
    const redisClient = this.getClient();
    return redisClient.call(command, ...args) as unknown as Promise<T>;
  }

  lpush(
    key: string,
    value: string,
    type?: keyof RedisClients,
    commander?: ChainableCommander,
  ): Promise<number> | ChainableCommander {
    const client = commander ?? this.getClient(type);

    if (commander) {
      commander.lpush(key, value);
      return commander;
    } else {
      return client.lpush(key, value);
    }
  }

  sadd(
    key: string,
    values: string | string[],
    type?: keyof RedisClients,
    commander?: ChainableCommander,
  ): Promise<number> | ChainableCommander {
    const client = commander ?? this.getClient(type);
    const value = Array.isArray(values) ? values : [values];
    if (commander) {
      commander.sadd(key, ...value);
      return commander;
    } else {
      return client.sadd(key, ...value);
    }
  }

  srem(
    key: string,
    values: string | string[],
    type?: keyof RedisClients,
    commander?: ChainableCommander,
  ): ChainableCommander | Promise<number> {
    const client = commander ?? this.getClient(type);
    const value = Array.isArray(values) ? values : [values];
    if (commander) {
      commander.srem(key, ...value);
      return commander;
    } else {
      return client.srem(key, ...value);
    }
  }

  smembers(
    key: string,
    type?: keyof RedisClients,
    commander?: ChainableCommander,
  ): Promise<string[]> | ChainableCommander {
    const client = commander ?? this.getClient(type);
    if (commander) {
      commander.smembers(key);
      return commander;
    } else {
      return client.smembers(key);
    }
  }

  sismemberDirect(
    key: string,
    member: string,
    type?: keyof RedisClients,
  ): Promise<number> {
    return this.getClient(type).sismember(key, member);
  }

  sismemberPipeline(
    key: string,
    member: string,
    commander: ChainableCommander,
  ): ChainableCommander {
    void commander.sismember(key, member);
    return commander;
  }

  async lrange(
    key: string,
    start = 0,
    stop = -1,
    type?: keyof RedisClients,
  ): Promise<string[]> {
    return this.getClient(type).lrange(key, start, stop);
  }

  async lrem(
    key: string,
    count: number,
    value: string,
    type?: keyof RedisClients,
  ): Promise<number> {
    return this.getClient(type).lrem(key, count, value);
  }

  async lindex(
    key: string,
    index: number,
    type?: keyof RedisClients,
  ): Promise<string | null> {
    return this.getClient(type).lindex(key, index);
  }

  set<T = any>(
    options: RedisSetOptions,
    commander?: ChainableCommander,
  ): Promise<'OK' | null> | ChainableCommander {
    const client = commander ?? this.getClient(options.type);
    const serialized = JSON.stringify(options.value);
    this.logger.debug(
      `Setting key ${options.key} with TTL=${options.ttl ?? 'KEEPTTL'}`,
    );

    if (options.ttl === undefined || options.ttl <= 0) {
      this.logger.error(`Invalid TTL when setting key: ${options.key}`, {
        options,
      });
      throw new Error(`Invalid TTL for key: ${options.key}`);
    }

    this.logger.debug(`Setting key ${options.key} with TTL=${options.ttl}`);
    return client.set(options.key, serialized, 'EX', options.ttl);
  }

  async getRaw(key: string, type?: keyof RedisClients): Promise<string | null> {
    const client = this.getClient(type);
    return client.get(key);
  }

  async get<T = any>(
    key: string,
    type?: keyof RedisClients,
  ): Promise<T | null> {
    const client = this.getClient(type);
    const raw = await client.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async mget<T = string>(
    keys: string[],
    type: keyof RedisClients = 'cacheRedis',
  ): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const client = this.getClient(type);
    const rawValues = await client.mget(...keys);
    return rawValues.map((raw) => {
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    });
  }

  pipelineGet(commander: ChainableCommander, key: string): ChainableCommander {
    commander.get(key);
    return commander;
  }

  async expire(
    key: string,
    ttl: number,
    type?: keyof RedisClients,
  ): Promise<boolean> {
    const client = this.getClient(type);
    const result = await client.expire(key, ttl);
    return result === 1;
  }

  async ttl(key: string, type?: keyof RedisClients): Promise<number> {
    try {
      return await this.getClient(type).ttl(key);
    } catch (e) {
      this.logger.error(`Redis TTL failed | key=${key}`, e);
      throw e;
    }
  }

  ttlInPipeline(
    commander: ChainableCommander,
    key: string,
  ): ChainableCommander {
    return commander.ttl(key);
  }

  async del(
    keys: string | string[],
    type: keyof RedisClients = 'cacheRedis',
    commander?: ChainableCommander,
  ): Promise<void | ChainableCommander> {
    if (Array.isArray(keys) && keys.length === 0) return;

    if (commander) {
      return Array.isArray(keys) ? commander.del(...keys) : commander.del(keys);
    }

    const client = this.getClient(type);
    if (Array.isArray(keys)) {
      await client.del(...keys);
    } else {
      await client.del(keys);
    }
  }

  async exists(
    keys: string | string[],
    type?: keyof RedisClients,
    commander?: ChainableCommander,
  ): Promise<boolean | ChainableCommander> {
    if (Array.isArray(keys) && keys.length === 0) return false;

    if (commander) {
      return Array.isArray(keys)
        ? commander.exists(...keys)
        : commander.exists(keys);
    }

    const client = this.getClient(type);
    const result = Array.isArray(keys)
      ? await client.exists(...keys)
      : await client.exists(keys);

    return result > 0;
  }

  async existsAll(
    keys: string[],
    type?: keyof RedisClients,
    commander?: ChainableCommander,
  ): Promise<boolean | ChainableCommander> {
    if (keys.length === 0) return false;

    if (commander) {
      return commander.exists(...keys);
    }

    const client = this.getClient(type);
    const result = await client.exists(...keys);

    return result === keys.length;
  }

  // REDIS HASH //

  hashSet(
    options: HashSetOptions,
    commander?: ChainableCommander,
    type?: keyof RedisClients,
  ): Promise<'OK' | null> | ChainableCommander {
    const { key, fields, ttlSeconds } = options;
    const client = commander ?? this.getClient(type);

    const flashFields: (string | number)[] = [];
    for (const [field, value] of Object.entries(fields)) {
      flashFields.push(field, value);
    }

    if (commander) {
      commander.hset(key, ...flashFields);
      if (ttlSeconds !== undefined) {
        commander.expire(key, ttlSeconds);
      }
      return commander;
    } else {
      return (async () => {
        try {
          const res = await client.hset(key, ...flashFields);
          if (ttlSeconds !== undefined) {
            await client.expire(key, ttlSeconds);
          }
          return res ? 'OK' : null;
        } catch (error) {
          this.logger.error(
            `[RedisHashService][hashSet] Error setting hash ${key}`,
            error,
          );
          throw error;
        }
      })();
    }
  }

  async hashGetFields(
    key: string,
    fields: string[],
    type?: keyof RedisClients,
  ): Promise<Record<string, string | number | null>> {
    const client = this.getClient(type);
    try {
      const values = await client.hmget(key, ...fields);
      const result: Record<string, string | number | null> = {};
      fields.forEach((field, idx) => {
        const val = values[idx];
        if (val === null) {
          result[field] = null;
        } else if (field === 'attemptCount') {
          result[field] = Number(val);
        } else {
          result[field] = val;
        }
      });
      return result;
    } catch (error: unknown) {
      this.logger.error(
        `[RedisHashService][hashSet] Error setting hash ${key}`,
        error,
      );
      throw error;
    }
  }

  async hashGetAllFields(
    key: string,
    type?: keyof RedisClients,
    numberFields: string[] = [],
    commander?: ChainableCommander,
  ): Promise<Record<string, string | number | null> | ChainableCommander> {
    const client = commander ?? this.getClient(type);

    if (commander) {
      return client.hgetall(key);
    }

    try {
      const data = (await client.hgetall(key)) as Record<string, string>;
      return parseHashResult(data, numberFields);
    } catch (error) {
      this.logger.error(
        `Redis HGETALL failed | key=${key} | type=${type ?? 'default'}`,
        { error },
      );

      throw error;
    }
  }

  async hashIncrement(
    key: string,
    field: string,
    incrementBy = 1,
    type?: keyof RedisClients,
  ): Promise<number> {
    const client = this.getClient(type);
    try {
      const newVal = await client.hincrby(key, field, incrementBy);
      return newVal;
    } catch (error) {
      console.error(
        `[RedisHashService][hashIncrement] Error incrementing field ${field} in hash ${key}:`,
        error,
      );
      throw error;
    }
  }

  multi(type?: keyof RedisClients): ChainableCommander {
    const client = this.getClient(type);
    return client.multi();
  }

  pipeline(type?: keyof RedisClients): ChainableCommander {
    const client = this.getClient(type);
    return client.pipeline();
  }

  async execMulti(multi: ChainableCommander, retries = 2): Promise<any[]> {
    while (retries > 0) {
      try {
        const results = await multi.exec();
        if (!results) {
          throw new Error('MULTI exec returned null');
        }
        return results.map(([err, res]) => {
          if (err) throw err;
          return res;
        });
      } catch (error) {
        this.logger.error(
          `Error executing Redis MULTI, retries left: ${retries}`,
          error,
        );
        retries--;
        if (retries === 0) {
          throw error;
        }

        await new Promise((r) => setTimeout(r, 100));
      }
    }
    throw new Error('Failed executing Redis MULTI after retries');
  }

  async execPipeline(pipeline: ChainableCommander): Promise<any[]> {
    try {
      const results = await pipeline.exec();
      if (!results) {
        throw new Error('PIPELINE exec returned null');
      }
      return results.map(([err, res]) => {
        if (err) throw err;
        return res;
      });
    } catch (error) {
      this.logger.error('Error executing Redis PIPELINE', error);
      throw error;
    }
  }

  get session() {
    return this.clients.sessionRedis;
  }
  get queue() {
    return this.clients.queueRedis;
  }

  get token() {
    return this.clients.tokenRedis;
  }
}
