import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  TokenPayloadMap,
} from 'src/types/token/token.types';

export interface TokenStore {
  generateTokenPair(
    accessPayload: AccessTokenPayload,
    refreshPayload: RefreshTokenPayload,
  ): TokenPair;

  generateAccessToken(payload: AccessTokenPayload): string;
  generateRefreshToken(payload: RefreshTokenPayload): string;

  verifyAccessToken(token: string): AccessTokenPayload;
  verifyRefreshToken(token: string): RefreshTokenPayload;

  decodeToken<T extends keyof TokenPayloadMap>(
    key: T,
    token: string,
  ): TokenPayloadMap[T] | null;

  isTokenExpired(token: string): boolean;
}
