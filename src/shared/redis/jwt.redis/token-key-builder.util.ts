import { createHash } from 'crypto';
import { Method } from 'src/shared/enums/statusRegister.enum';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPayloadMap,
  TokenRedisKey,
} from 'src/types/token/token.types';

export class TokenKeyBuilder {
  static getEncodedId(payload: AccessTokenPayload): string {
    const base = payload.email ?? payload.phoneNumber;
    if (!base) throw new Error('Missing identifier (email or phone)');
    return createHash('sha256').update(base).digest('hex');
  }

  static buildAccessKey(
    payload: AccessTokenPayload,
    purpose: Method,
    deviceId: string,
  ): TokenRedisKey {
    const encodedId = this.getEncodedId(payload);

    const jti = payload.jti;

    const JwtKey = `access:${encodedId}:${deviceId}:${jti}`;
    const indexKey = this.getIndexKey(
      'accessToken',
      encodedId,
      purpose,
      'encoded',
    );
    const jtiIndexKey = `access:index:jti:${jti}`;

    return { JwtKey, indexKey, jtiIndexKey };
  }

  static buildRefreshKey(
    payload: RefreshTokenPayload,
    purpose: Method,
    deviceId: string,
  ): TokenRedisKey {
    const userId = payload.sub;

    const jti = payload.jti;

    const JwtKey = `refresh:${userId}:${deviceId}:${jti}`;
    const indexKey = this.getIndexKey(
      'refreshToken',
      userId,
      purpose,
      'userId',
    );
    const jtiIndexKey = `refresh:index:jti:${jti}`;

    return { JwtKey, indexKey, jtiIndexKey };
  }

  static buildJwtRefreshKey(
    userId: string,
    deviceId: string,
    jti: string,
  ): string {
    return `refresh:${userId}:${deviceId}:${jti}`;
  }

  static buildSessionKey(userId: string, deviceId: string) {
    return `session:${userId}:${deviceId}`;
  }

  static buildSessionIdKey(id: string) {
    return `sessionId:${id}`;
  }

  static getIndexKey<K extends keyof TokenPayloadMap>(
    type: K,
    identifier: string,
    purpose: Method,
    by: 'userId' | 'encoded' = 'encoded',
  ): string {
    const prefix = type === 'accessToken' ? 'access' : 'refresh';
    const scope = by === 'encoded' ? `user:${identifier}` : `uid:${identifier}`;
    return `${prefix}:index:${scope}:${purpose}`;
  }

  static getIndexSessionKey(userId: string) {
    return `session:index:${userId}`;
  }

  static extractJtiFromKey(key: string): string {
    const parts = key.split(':');
    return parts[parts.length - 1];
  }

  static buildJtiIndexKey(
    typeToken: keyof TokenPayloadMap,
    jti: string,
  ): string {
    const tokenType = typeToken === 'accessToken' ? 'access' : 'refresh';
    return `${tokenType}:index:jti:${jti}`;
  }
}
