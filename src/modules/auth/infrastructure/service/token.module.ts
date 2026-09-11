import { Module } from '@nestjs/common';

import { TokenServiceImpl } from './token.service.imp';
import { JwtRedisModule } from 'src/shared/redis/jwt.redis/jwt.redis.module';
import { JwtModule } from 'src/shared/infrastructure/service/jwt-jti/jwt-token.module';
import { RedisModule } from 'src/shared/redis/redis.module';

@Module({
  imports: [RedisModule, JwtModule, JwtRedisModule],
  providers: [TokenServiceImpl],
  exports: [TokenServiceImpl],
})
export class TokenModule {}
