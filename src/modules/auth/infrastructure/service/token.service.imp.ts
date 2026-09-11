import { Injectable, Logger } from '@nestjs/common';
import { ChainableCommander } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

import { Method } from 'src/shared/enums/statusRegister.enum';
import { JwtTokenService } from 'src/shared/infrastructure/service/jwt-jti/jwt-token.service';
import { TokenService } from 'src/shared/port/jwt/token.service';
import { JwtRedisService } from 'src/shared/redis/jwt.redis/jwt.redis.service';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisClients } from 'src/types/redis/redis.types';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenMetaWithoutKey,
  TokenPayloadMap,
} from 'src/types/token/token.types';
import { TokenKeyBuilder } from 'src/shared/redis/jwt.redis/token-key-builder.util';
import { getExpiresInSeconds } from 'src/helper/getExpiresInSeconds';
import { SessionData } from 'src/types/session/Session';

@Injectable()
export class TokenServiceImpl implements TokenService {
  private readonly logger = new Logger(TokenServiceImpl.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtRedisService: JwtRedisService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  private async generateAndSaveToken<K extends keyof TokenPayloadMap>(
    key: K,
    payload: Omit<TokenPayloadMap[K], 'jti'>,
    options: {
      purpose: Method;
      type: keyof RedisClients;
      meta: TokenMetaWithoutKey;
      multi?: ChainableCommander;
      identifier?: string;
      role?: string;
      ttlSessionId?: number;
    },
  ): Promise<{
    token: string;
    jti: string;
    expiresIn: number;
    csrfToken?: string;
    sessionId?: string;
  }> {
    const jti = uuidv4();
    const ttl = this.jwtTokenService.getExpiresIn(key);

    const fullPayload = { ...payload, jti } as TokenPayloadMap[K];

    const token = this.generateTokenByKey(key, fullPayload);

    const { expiresIn, csrfToken, sessionId } =
      await this.jwtRedisService.saveJwt(
        options.purpose,
        key,
        fullPayload,
        options.type,
        options.meta,
        ttl,
        options.multi,
        options.identifier,
        options.role,
        options.ttlSessionId,
      );

    if (typeof expiresIn !== 'number') {
      throw new Error('Failed to save token');
    }

    return { token, jti, expiresIn, csrfToken, sessionId };
  }

  async createToken<K extends keyof TokenPayloadMap>(
    payload: Omit<TokenPayloadMap[K], 'jti'>,
    options: {
      purpose: Method;
      key: K;
      type: keyof RedisClients;
      meta: TokenMetaWithoutKey;
    },
  ): Promise<{ token: string; expiresIn: number; jti: string }> {
    return this.generateAndSaveToken(options.key, payload, options);
  }

  async createTokenPair(
    accessPayload: Omit<AccessTokenPayload, 'jti'>,
    refreshPayload: Omit<RefreshTokenPayload, 'jti'>,
    options: {
      purpose: Method;
      type: keyof RedisClients;
      meta: TokenMetaWithoutKey;
      identifier?: string;
      role?: string;
    },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    accessJti: string;
    refreshJti: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
    csrfToken?: string;
    sessionId?: string;
    ttlSessionId: number;
  }> {
    const ttlSessionIdStr = this.jwtTokenService.getSessionExpires();
    const ttlSessionId = getExpiresInSeconds(ttlSessionIdStr);
    const multi = this.redisService.multi(options.type);

    const [access, refresh] = await Promise.all([
      this.generateAndSaveToken('accessToken', accessPayload, {
        ...options,
        multi,
      }),
      this.generateAndSaveToken('refreshToken', refreshPayload, {
        ...options,
        multi,
        identifier: options.identifier,
        role: options.role,
        ttlSessionId: ttlSessionId,
      }),
    ]);

    await this.redisService.execMulti(multi);

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      accessJti: access.jti,
      refreshJti: refresh.jti,
      accessExpiresIn: access.expiresIn,
      refreshExpiresIn: refresh.expiresIn,
      csrfToken: refresh.csrfToken,
      sessionId: refresh.sessionId,
      ttlSessionId,
    };
  }

  generateTokenByKey<K extends keyof TokenPayloadMap>(
    key: K,
    payload: TokenPayloadMap[K],
  ): string {
    return this.jwtTokenService.generateTokenByKey(key, payload);
  }

  async refreshToken(
    accessPayload: Omit<AccessTokenPayload, 'jti'>,
    options: {
      purpose: Method;
      type: keyof RedisClients;
      meta: TokenMetaWithoutKey;
    },
  ): Promise<{
    accessToken: string;
    accessJti: string;
    accessExpiresIn: number;
  }> {
    const result = await this.generateAndSaveToken(
      'accessToken',
      accessPayload,
      options,
    );

    return {
      accessToken: result.token,
      accessJti: result.jti,
      accessExpiresIn: result.expiresIn,
    };
  }

  async revokeToken(
    jtiAccess: string | undefined,
    jtiRefresh: string,
    sessionId: string,
    type: keyof RedisClients = 'cacheRedis',
  ): Promise<boolean> {
    const sessionIdKey = TokenKeyBuilder.buildSessionIdKey(sessionId);
    const multi = this.redisService.multi(type);

    const accessIndexKey = jtiAccess ? `access:index:jti:${jtiAccess}` : null;
    const refreshIndexKey = `refresh:index:jti:${jtiRefresh}`;

    const keysToCheck: string[] = [];
    if (accessIndexKey) keysToCheck.push(accessIndexKey);
    keysToCheck.push(refreshIndexKey);

    const results = await this.redisService.mget<string>(keysToCheck, type);
    const accessJwtKey = accessIndexKey ? results[0] : undefined;
    const refreshJwtKey = results[accessIndexKey ? 1 : 0];

    if (accessJwtKey) multi.del(accessJwtKey);
    if (refreshJwtKey) multi.del(refreshJwtKey);
    if (accessIndexKey) multi.del(accessIndexKey);
    multi.del(refreshIndexKey);
    multi.del(sessionIdKey);

    await this.redisService.execMulti(multi);

    this.logger.warn(
      `Revoked tokens: accessJTI=${jtiAccess ?? 'N/A'}, refreshJTI=${jtiRefresh}`,
    );
    return true;
  }

  decodeToken<T extends keyof TokenPayloadMap>(
    key: T,
    token: string,
  ): TokenPayloadMap[T] | null {
    if (!token) {
      this.logger.warn(`decodeToken called with empty token for key=${key}`);
      return null;
    }

    try {
      const decoded = this.jwtTokenService.decodeToken<T>(key, token);

      if (!decoded) {
        this.logger.warn(`Token decode returned null for key=${key}`);
        return null;
      }

      return decoded;
    } catch (error) {
      this.logger.error(
        `Failed to decode token for key=${key}: ${(error as Error).message}`,
        error as any,
      );
      return null;
    }
  }

  async getSessionId(id: string): Promise<SessionData | null> {
    const sessionKey = TokenKeyBuilder.buildSessionIdKey(id);

    const session = await this.redisService.get<SessionData>(sessionKey);

    if (!session) return null;

    return session;
  }
}
