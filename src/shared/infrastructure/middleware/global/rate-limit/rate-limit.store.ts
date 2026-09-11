import { Injectable, Logger } from '@nestjs/common';
import RedisStore from 'rate-limit-redis';
import { RedisService } from 'src/shared/redis/redis.service';

@Injectable()
export class RateLimitStore extends RedisStore {
  constructor(redisService: RedisService) {
    const logger = new Logger(RateLimitStore.name);

    super({
      prefix: 'rate-limit',
      sendCommand: async (command: string, ...args: string[]) => {
        await redisService.waitUntilReady();
        logger.debug(
          `RateLimitStore sendCommand: ${command} ${args.join(',')}`,
        );
        return redisService.callRedis(command, ...args);
      },
    });
  }
}
