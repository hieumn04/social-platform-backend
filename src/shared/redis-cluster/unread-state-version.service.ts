import { Injectable } from '@nestjs/common';

import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';

/**
 * Generates a monotonic, per-user version for unread snapshots.
 *
 * A timestamp-sized floor keeps versions increasing even when the Redis key is
 * recreated. SETNX + INCR is safe under concurrent writers for the same user.
 */
@Injectable()
export class UnreadStateVersionService {
  constructor(private readonly redis: RedisClusterService) {}

  private key(userId: string): string {
    return `unread-state:{${userId}}:version`;
  }

  async next(userId: string): Promise<string> {
    const client = await this.redis.getCluster();
    const floor = Date.now() * 1000;
    const key = this.key(userId);

    await client.setnx(key, String(floor));
    const result = await client.incr(key);

    return String(result);
  }

  async current(userId: string): Promise<string> {
    const client = await this.redis.getCluster();
    const current = await client.get(this.key(userId));

    return current ?? this.next(userId);
  }
}
