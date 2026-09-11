import { RedisModule } from 'src/shared/redis/redis.module';
import { RateLimitStore } from './rate-limit.store';
import { RateLimitService } from './rate-limit.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [RedisModule],
  providers: [RateLimitStore, RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
