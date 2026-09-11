import { Module } from '@nestjs/common';

import { LoggerModule } from 'src/shared/logger/logger.module';
import { JwtRedisModule } from 'src/shared/redis/jwt.redis/jwt.redis.module';
import { JwtAccessStrategy } from './jwtAccress.strategy';
import { JwtRefreshStrategy } from './jwtRefresh.strategy';
import { ConfigModule } from 'src/shared/config/config.module';
import { RedisModule } from 'src/shared/redis/redis.module';

@Module({
  imports: [RedisModule, JwtRedisModule, ConfigModule, LoggerModule],
  providers: [JwtAccessStrategy, JwtRefreshStrategy],
  exports: [JwtAccessStrategy, JwtRefreshStrategy],
})
export class StrategiesModule {}
