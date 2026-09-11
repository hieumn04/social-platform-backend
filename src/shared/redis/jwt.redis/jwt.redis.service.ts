import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisClients } from 'src/types/redis/redis.types';
import { RedisService } from '../redis.service';
import { Method } from 'src/shared/enums/statusRegister.enum';
import { v4 as uuidv4 } from 'uuid';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenMeta,
  TokenMetaWithoutKey,
  TokenPayloadMap,
} from 'src/types/token/token.types';

import { AppLogger } from 'src/shared/logger/applogger';

import { TokenKeyBuilder } from './token-key-builder.util';
import { ChainableCommander } from 'ioredis';
import { flattenSimple } from 'src/helpers/object';
import { SessionCompareContext } from 'src/types/token/refreshToken.props';
import { RedisSessionData } from 'src/types/redis/objectRedis.types';
import { SessionMapper } from '../mapper/session.mapper';
import { SessionData } from 'src/types/session/Session';

@Injectable()
export class JwtRedisService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(JwtRedisService.name);
  }

  private setWithTTLIfNew(
    key: string,
    value: unknown,
    ttl: number,
    type: keyof RedisClients,
    multi?: ChainableCommander,
  ) {
    return this.redisService.set(
      {
        key,
        value,
        ttl,
        type,
      },
      multi,
    );
  }

  async saveJwt<K extends keyof TokenPayloadMap>(
    purpose: Method,
    key: K,
    payload: TokenPayloadMap[K],
    type: keyof RedisClients,
    meta: TokenMetaWithoutKey,
    ttl: number,
    multi?: ChainableCommander,
    identifier?: string,
    role?: string,
    ttlSessionId?: number,
  ): Promise<{ expiresIn: number; csrfToken?: string; sessionId?: string }> {
    let JwtKey: string;
    let indexKey: string;
    let jtiIndexKey: string;
    let tokenMeta: TokenMeta;

    const deviceId = meta.requestContext.deviceId;
    const tx = multi ?? this.redisService.multi(type);
    let csrfToken: string | undefined;
    let sessionId: string | undefined;

    if (key === 'accessToken') {
      const accessPayload = payload as AccessTokenPayload;

      ({ JwtKey, indexKey, jtiIndexKey } = TokenKeyBuilder.buildAccessKey(
        accessPayload,
        purpose,
        deviceId,
      ));
      const sessionKey = TokenKeyBuilder.buildSessionKey(
        accessPayload.sub,
        deviceId,
      );
      const sessionIndexKey = TokenKeyBuilder.getIndexSessionKey(
        accessPayload.sub,
      );

      tokenMeta = {
        key: accessPayload.jti,
        requestContext: meta.requestContext,
      };

      const fields = flattenSimple(tokenMeta);

      void this.setWithTTLIfNew(JwtKey, payload, ttl, type, tx);
      void this.setWithTTLIfNew(jtiIndexKey, JwtKey, ttl, type, tx);

      void this.redisService.sadd(sessionIndexKey, deviceId, type, tx);

      await this.redisService.execMulti(tx);
    } else {
      sessionId = uuidv4();
      csrfToken = uuidv4();
      const refreshPayload = payload as RefreshTokenPayload;

      ({ JwtKey, indexKey, jtiIndexKey } = TokenKeyBuilder.buildRefreshKey(
        refreshPayload,
        purpose,
        deviceId,
      ));
      if (!identifier || !role)
        throw new Error('identifier and role required for refreshSession');

      const sessionIdKey = TokenKeyBuilder.buildSessionIdKey(sessionId);

      tokenMeta = {
        key: refreshPayload.jti,
        requestContext: meta.requestContext,
      };

      void this.setWithTTLIfNew(JwtKey, payload, ttl, type, tx);
      void this.redisService.lpush(
        indexKey,
        JSON.stringify(tokenMeta),
        type,
        tx,
      );
      void this.setWithTTLIfNew(jtiIndexKey, JwtKey, ttl, type, tx);
      const sessionData: SessionData = {
        csrfToken,
        identifier,
        role,
        deviceId,
        sub: refreshPayload.sub,
      };
      void this.setWithTTLIfNew(
        sessionIdKey,
        sessionData,
        ttlSessionId!,
        type,
        tx,
      );

      await this.redisService.execMulti(tx);
    }

    return { expiresIn: ttl, csrfToken, sessionId };
  }

  async checkDeviceId(sub: string, deviceId: string): Promise<boolean> {
    const sessionKey = TokenKeyBuilder.buildSessionKey(sub, deviceId);
    const isMemberDirect = await this.redisService.sismemberDirect(
      sessionKey,
      deviceId,
    );
    return isMemberDirect === 1;
  }



  buildValidateSession(
    multi: ChainableCommander,
    deviceId: string,
    userId: string,
    type: keyof RedisClients = 'cacheRedis',
  ) {
    // const sessionKey = TokenKeyBuilder.buildSessionKey(userId, deviceId);
    const sessionIndexKey = TokenKeyBuilder.getIndexSessionKey(userId);
    void this.redisService.sismemberPipeline(sessionIndexKey, deviceId, multi);

    // void this.redisService.exists(sessionKey, type, multi);
    // void this.redisService.ttlInPipeline(multi, sessionKey);
    // void this.redisService.hashGetAllFields(
    //   sessionKey,
    //   type,
    //   ['startTime'],
    //   multi,
    // );
  }

  parseValidateSessionResults(
    results: [
      string | number | null,
      string | number | null,
      Record<string, string | null>,
    ], // sismember, ttl, hgetall
  ): SessionCompareContext {
    const [isMemberRaw, ttlRaw, rawSession] = results;

    const isMember = Number(isMemberRaw);
    const ttl = Number(ttlRaw);

    if (!Number.isFinite(isMember) || !Number.isFinite(ttl)) {
      throw new UnauthorizedException('Invalid Redis response format');
    }

    if (isMember !== 1) {
      throw new UnauthorizedException('Device not registered in session index');
    }

    if (ttl <= 0) {
      throw new UnauthorizedException('Session expired');
    }

    if (!rawSession || Object.keys(rawSession).length === 0) {
      throw new UnauthorizedException('Session not found or revoked');
    }

    const redisData = rawSession as unknown as RedisSessionData;

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(' Redis session validated', {
        redisData,
      });
    }

    return SessionMapper.toDomain(redisData);
  }

  async revokeKeys(
    keys: string[],
    type: keyof RedisClients = 'cacheRedis',
  ): Promise<void> {
    if (!keys.length) return;

    const multi = this.redisService.multi(type);
    keys.forEach((k) => multi.del(k));
    await this.redisService.execMulti(multi);

    this.logger.warn(`Revoked keys: ${keys.join(', ')}`);
  }

  async getLatestValidJtiByUser<K extends keyof TokenPayloadMap>(
    key: K,
    payload: TokenPayloadMap[K],
    purpose: Method,
    type: keyof RedisClients = 'cacheRedis',
  ): Promise<string | null> {
    let indexKey: string;

    if (key === 'accessToken') {
      const accessPayload = payload as AccessTokenPayload;

      const encoded = accessPayload.email || accessPayload.phoneNumber;
      const identifier = encoded ?? accessPayload.sub;
      const by: 'encoded' | 'userId' = encoded ? 'encoded' : 'userId';

      indexKey = TokenKeyBuilder.getIndexKey(
        'accessToken',
        identifier,
        purpose,
        by,
      );
    } else {
      const refreshPayload = payload as RefreshTokenPayload;
      const identifier = refreshPayload.sub;
      const by = 'userId' as const;
      indexKey = TokenKeyBuilder.getIndexKey(
        'refreshToken',
        identifier,
        purpose,
        by,
      );
    }

    const latestMetaStr = await this.redisService.lindex(indexKey, 0, type);
    if (!latestMetaStr) return null;
    try {
      const meta = JSON.parse(latestMetaStr) as TokenMeta;
      const jwtKey = meta.key;
      const jti = TokenKeyBuilder.extractJtiFromKey(jwtKey);
      const jtiIndexKey = TokenKeyBuilder.buildJtiIndexKey(key, jti);
      const exists = await this.redisService.exists(jtiIndexKey, type);
      return exists ? jti : null;
    } catch (err: unknown) {
      this.logger.error('Failed to get latest JTI', {
        indexKey,
        error: err as Error,
      });
      return null;
    }
  }

  async revokeAllTokenByUser(
    userId: string,
    typeToken: keyof TokenPayloadMap,
    purpose: Method,
    type: keyof RedisClients = 'cacheRedis',
  ): Promise<void> {
    const indexKey = TokenKeyBuilder.getIndexKey(
      typeToken,
      userId,
      purpose,
      'userId',
    );
    const metas = await this.redisService.lrange(indexKey, 0, -1, type);
    if (!metas?.length) return;

    const parsed = metas
      .map((m) => {
        try {
          return JSON.parse(m) as TokenMeta;
        } catch {
          return null;
        }
      })
      .filter((m): m is TokenMeta & { key: string } => !!m?.key);

    const keys = parsed.map((m) => m.key);
    if (keys.length > 0) {
      await this.redisService.del(keys, type);
    }
    await this.redisService.del(indexKey, type);
  }

  sismemberPipeline(
    key: string,
    member: string,
    commander: ChainableCommander,
  ): ChainableCommander {
    const sub = TokenKeyBuilder.getIndexSessionKey(key);
    void commander.sismember(sub, member);
    return commander;
  }

  async sismemberDirect(
    key: string,
    member: string,
    type?: keyof RedisClients,
  ): Promise<boolean> {
    const sub = TokenKeyBuilder.getIndexSessionKey(key);
    const result = await this.redisService.sismemberDirect(sub, member, type);
    return result === 1;
  }

  async hasValidTTL(
    typeToken: keyof TokenPayloadMap,
    jti: string,
    type?: keyof RedisClients | 'cacheRedis',
  ): Promise<boolean> {
    const key = TokenKeyBuilder.buildJtiIndexKey(typeToken, jti);
    const ttl = await this.redisService.ttl(key, type);

    if (ttl > 0) {
      this.logger.debug(`[JWT] JTI ${jti} still valid, TTL remaining: ${ttl}s`);
      return true;
    }

    this.logger.warn(`[JWT] JTI ${jti} expired or revoked (ttl=${ttl})`);
    return false;
  }

  validTTLMulti(
    multi: ChainableCommander,
    typeToken: keyof TokenPayloadMap,
    jtis: string[],
  ): void {
    const keys = jtis.map((jti) =>
      TokenKeyBuilder.buildJtiIndexKey(typeToken, jti),
    );

    keys.forEach((key) => multi.ttl(key));
  }

  validateTTLRefreshToken(
    jti: string,
    sub: string,
    deviceId: string,
    multi: ChainableCommander,
  ): ChainableCommander {
    const currentJwtKey = TokenKeyBuilder.buildJwtRefreshKey(
      sub,
      deviceId,
      jti,
    );
    return this.redisService.ttlInPipeline(multi, currentJwtKey);
  }
}
