import { RedisClients } from 'src/types/redis/redis.types';

let clients: RedisClients | null = null;

export const setRedisClients = (redisClients: RedisClients): void => {
  clients = redisClients;
};

export const getRedisClient = (type: keyof RedisClients = 'cacheRedis') => {
  if (!clients) throw new Error('Redis clients not initialized');
  return clients[type];
};
