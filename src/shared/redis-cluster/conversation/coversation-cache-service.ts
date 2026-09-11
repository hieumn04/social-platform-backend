import { Injectable } from '@nestjs/common';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';

@Injectable()
export class ConversationCacheService {
  constructor(private readonly redis: RedisClusterService) { }

  async getConversationId(threadId: string): Promise<string | null> {
    return this.redis.raw.get(WsRedisKeys.threadMetaKey(threadId));
  }

  async setConversationId(threadId: string, conversationId: string) {
    void this.redis.raw.set(
      WsRedisKeys.threadMetaKey(threadId),
      conversationId,
      'EX',
      60 * 60 * 24,
    );
  }

  async getParticipants(threadId: string): Promise<string[]> {
    return this.redis.raw.smembers(WsRedisKeys.participantsKey(threadId));
  }

  async setParticipants(threadId: string, userIds: string[]) {
    if (!userIds.length) return;

    await this.redis
      .multi()
      .del(WsRedisKeys.participantsKey(threadId))
      .sadd(WsRedisKeys.participantsKey(threadId), ...userIds)
      .expire(WsRedisKeys.participantsKey(threadId), 60 * 60 * 6)
      .exec();
  }
}
