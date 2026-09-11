import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);

  constructor(private readonly redisCluster: RedisClusterService) {}

  private buildKey(key: string): string {
    return `lock:${key}`;
  }

  /**
   * Run a function inside a distributed lock (Native Redis SET NX)
   */
  async runWithLock<T>(
    key: string,
    ttl: number, // in milliseconds
    fn: () => Promise<T>,
    maxRetries = 3,
    retryDelayMs = 200,
  ): Promise<T> {
    const resource = this.buildKey(key);
    const client = this.redisCluster.raw;
    // Generate a quick random string to identify this specific lock instance
    const lockValue = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`[LOCK] Attempt ${attempt} - acquiring ${resource}`);

        // Try to acquire the lock: SET key value PX ttl NX
        const acquired = await client.set(resource, lockValue, 'PX', ttl, 'NX');

        if (acquired === 'OK') {
          try {
            // Chạy hàm UseCase
            return await fn();
          } finally {
            this.logger.debug(`[LOCK] releasing ${resource}`);
            // Dùng Lua script để gỡ khoá cực kỳ an toàn (chỉ gỡ khoá chính chủ)
            const script = `
              if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
              else
                return 0
              end
            `;
            await client.eval(script, 1, resource, lockValue).catch((err) => {
              this.logger.error(
                `[LOCK] safe release failed for ${resource}`,
                err,
              );
            });
          }
        }
      } catch (error: any) {
        this.logger.warn(
          `[LOCK] Attempt ${attempt} failed to query Redis`,
          error,
        );
      }

      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        this.logger.error(
          `[LOCK] Failed to acquire lock ${resource} after ${maxRetries} attempts`,
        );
        throw new Error(`Failed to acquire lock for ${resource}`);
      }

      // Đợi trước khi thử lại
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelayMs * attempt),
      );
    }

    throw new Error(`[LOCK] Unexpected failure for ${resource}`);
  }
}
