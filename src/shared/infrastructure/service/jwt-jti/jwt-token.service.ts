import jwt from 'jsonwebtoken';

import {
  AccessTokenPayload,
  JwtClaims,
  RefreshTokenPayload,
  TokenPair,
  TokenPayloadMap,
} from 'src/types/token/token.types';

import { TokenStore } from 'src/shared/port/jwt/tokenStore';

import { getExpiresInSeconds } from 'src/helper/getExpiresInSeconds';
import { NestConfigService } from 'src/shared/config/config.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class JwtTokenService implements TokenStore {
  constructor(private readonly config: NestConfigService) {}
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(
      payload,
      this.config.jwt.accessTokenSecret,
      this.getSignOptions(this.config.jwt.accessTokenExpiresIn),
    );
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(
      payload,
      this.config.jwt.refreshTokenSecret,
      this.getSignOptions(this.config.jwt.refreshTokenExpiresIn),
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(
        token,
        this.config.jwt.accessTokenSecret,
      ) as AccessTokenPayload;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  getSessionExpires(): string {
    return this.config.jwt.sessionTokenExpiresIn;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const payload = jwt.verify(
        token,
        this.config.jwt.refreshTokenSecret,
      ) as RefreshTokenPayload;
      return payload;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  decodeToken<T extends keyof TokenPayloadMap>(
    key: T,
    token: string,
  ): TokenPayloadMap[T] | null {
    try {
      const decoded = jwt.decode(token);
      return decoded ? (decoded as TokenPayloadMap[T]) : null;
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const decoded = jwt.decode(token) as JwtClaims | null;
    if (!decoded || typeof decoded.exp !== 'number') return true;
    return decoded.exp < Math.floor(Date.now() / 1000);
  }

  private getSignOptions(
    expiresIn: jwt.SignOptions['expiresIn'],
  ): jwt.SignOptions {
    return {
      expiresIn,
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience,
    };
  }

  generateTokenByKey<K extends keyof TokenPayloadMap>(
    key: K,
    payload: TokenPayloadMap[K],
  ): string {
    switch (key) {
      case 'accessToken': {
        const p = payload as AccessTokenPayload;
        return this.generateAccessToken(p);
      }

      case 'refreshToken': {
        const p = payload as RefreshTokenPayload;
        return this.generateRefreshToken(p);
      }

      default:
        throw new Error(`Unsupported token key: ${String(key)}`);
    }
  }

  generateTokenPair(
    accessPayload: AccessTokenPayload,
    refreshPayload: RefreshTokenPayload,
  ): TokenPair {
    const accessToken = this.generateAccessToken(accessPayload);
    const refreshToken = this.generateRefreshToken(refreshPayload);
    return { accessToken, refreshToken };
  }

  getExpiresIn(key: keyof TokenPayloadMap): number {
    const expiresIn =
      key === 'accessToken'
        ? this.config.jwt.accessTokenExpiresIn
        : key === 'refreshToken'
          ? this.config.jwt.refreshTokenExpiresIn
          : (() => {
              throw new Error(`Unknown token key: ${key as string}`);
            })();
    if (expiresIn === undefined) {
      throw new Error(`expiresIn is undefined for token key: ${key}`);
    }
    return getExpiresInSeconds(expiresIn);
  }
}
