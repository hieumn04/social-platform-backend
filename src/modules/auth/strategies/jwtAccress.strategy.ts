import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { NestConfigService } from 'src/shared/config/config.service';
import { AppLogger } from 'src/shared/logger/applogger';
import { JwtRedisService } from 'src/shared/redis/jwt.redis/jwt.redis.service';
import { TokenKeyBuilder } from 'src/shared/redis/jwt.redis/token-key-builder.util';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisClients } from 'src/types/redis/redis.types';
import { AccessTokenPayload } from 'src/types/token/token.types';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: NestConfigService,
    private readonly redisService: RedisService,
    private readonly jwtRedisService: JwtRedisService,
    private readonly logger: AppLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (_request: any, _rawJwtToken: any, done) => {
        try {
          const secret = configService.jwt.accessTokenSecret;
          done(null, secret);
        } catch (err) {
          done(err, undefined);
        }
      },
    });
    this.logger.setContext(JwtAccessStrategy.name);
  }

  async validate(payload: AccessTokenPayload): Promise<AccessTokenPayload> {
    const { sub, deviceId, jti } = payload;
    const clientType: keyof RedisClients = 'cacheRedis';
    const sessionIndexKey = TokenKeyBuilder.getIndexSessionKey(sub);
    const multi = this.redisService.multi(clientType);
    void this.redisService.sismemberPipeline(sessionIndexKey, deviceId, multi);
    void this.jwtRedisService.validTTLMulti(multi, 'accessToken', [jti]);

    let results: number | any[];
    try {
      results = await this.redisService.execMulti(multi);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(`Redis pipeline failed: ${err.message}`, {
          stack: err.stack,
        });
      } else {
        this.logger.error(`Redis pipeline failed: ${String(err)}`);
      }
      throw new InternalServerErrorException('Redis error');
    }

    if (!Array.isArray(results) || results.length < 2) {
      this.logger.warn('Unexpected redis results shape', { results });
      throw new UnauthorizedException('Unauthorized');
    }

    const isMember = Number(results[0]);
    const JtiTTL = Number(results[1]);

    if (!Number.isFinite(isMember) || !Number.isFinite(JtiTTL)) {
      throw new UnauthorizedException('Invalid Redis response format');
    }

    if (isMember !== 1) {
      throw new UnauthorizedException('Device not registered in session index');
    }

    if (JtiTTL <= 0) {
      throw new UnauthorizedException('Session expired');
    }

    return payload;
  }
}
