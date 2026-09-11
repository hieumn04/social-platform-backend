import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { assertTuple } from 'src/helpers/helper';
import { NestConfigService } from 'src/shared/config/config.service';
import { AppLogger } from 'src/shared/logger/applogger';
import { JwtRedisService } from 'src/shared/redis/jwt.redis/jwt.redis.service';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisClients } from 'src/types/redis/redis.types';
import { RefreshTokenPayload } from 'src/types/token/token.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: NestConfigService,
    private readonly redisService: RedisService,
    private readonly jwtRedisService: JwtRedisService,
    private readonly logger: AppLogger,
  ) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.['refreshToken'] || null,
      ignoreExpiration: false,
      secretOrKeyProvider: (_request: any, _rawJwtToken: any, done) => {
        try {
          const secret = configService.jwt.refreshTokenSecret;
          done(null, secret);
        } catch (err) {
          done(err, undefined);
        }
      },
    });
    this.logger.setContext(JwtRefreshStrategy.name);
  }

  async validate(payload: RefreshTokenPayload): Promise<RefreshTokenPayload> {
    const { jti, sub, requestContext } = payload;
    const clientType: keyof RedisClients = 'cacheRedis';
    const multi = this.redisService.multi(clientType);

    void this.jwtRedisService.validTTLMulti(multi, 'refreshToken', [jti]);

    void this.jwtRedisService.validateTTLRefreshToken(
      jti,
      sub,
      requestContext.deviceId,
      multi,
    );
    this.jwtRedisService.buildValidateSession(
      multi,
      requestContext.deviceId,
      sub,
      clientType,
    );

    let results: number | any[];
    try {
      results = await this.redisService.execMulti(multi);
    } catch (err: unknown) {
      this.logger.error(`Redis pipeline error : ${(err as Error).message}`);
      throw new UnauthorizedException('Redis pipeline error');
    }

    this.logger.debug('redis exec results', { results });

    if (!Array.isArray(results) || results.length < 2) {
      this.logger.warn('Unexpected redis results shape', { results });
      throw new UnauthorizedException('Unauthorized');
    }

    const rawJtiTTL = Number(results[0]);
    const rawRefreshTTL = Number(results[1]);
    const sessionExists = Number(results[2]);
    // const sessionParts = results.slice(2);

    const jtiTTL = Number.isFinite(rawJtiTTL) ? rawJtiTTL : -1;
    const refreshTTL = Number.isFinite(rawRefreshTTL) ? rawRefreshTTL : -1;

    if (jtiTTL <= 0 || refreshTTL <= 0 || sessionExists !== 1) {
      this.logger.warn(`Refresh token invalid or expired for userId=${sub}`, {
        jtiTTL,
        refreshTTL,
        sessionExists,
      });
      throw new UnauthorizedException('Unauthorized');
    }

    // if (sessionParts.length < 3) {
    //   this.logger.error('Invalid session validation result', { sessionParts });
    //   throw new UnauthorizedException('Invalid session validation result');
    // }

    // const sessionTuple = assertTuple<
    //   [
    //     string | number | null,
    //     string | number | null,
    //     Record<string, string | null>,
    //   ]
    // >(sessionParts, 3);

    this.logger.debug('Session validated');

    return payload;
  }
}
