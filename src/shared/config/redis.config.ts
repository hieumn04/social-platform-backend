import { registerAs } from '@nestjs/config';
import { getEnv } from 'src/helper/getEnv';
import { MultiRedisConfig } from 'src/types/redis/redis.types';

export const redisConfig = registerAs('redis', (): MultiRedisConfig => {
  return {
    host: getEnv('REDIS_HOST'),
    port: parseInt(getEnv('REDIS_PORT'), 10),
    password: process.env.REDIS_PASSWORD,

    dbs: {
      cache: parseInt(getEnv('REDIS_CACHE_DB'), 10),
      session: parseInt(getEnv('REDIS_SESSION_DB'), 10),
      queue: parseInt(getEnv('REDIS_QUEUE_DB'), 10),
      token: parseInt(getEnv('REDIS_TOKEN_DB'), 10),
    },
  };
});
