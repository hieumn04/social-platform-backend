import { Module } from '@nestjs/common';

import { RedisModule } from '../redis.module';
import { JwtRedisService } from './jwt.redis.service';
import { LoggerModule } from 'src/shared/logger/logger.module';

@Module({
  imports: [RedisModule, LoggerModule],
  providers: [JwtRedisService],
  exports: [JwtRedisService],
})
export class JwtRedisModule {}
