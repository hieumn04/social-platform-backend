import { SignOptions } from 'jsonwebtoken';

import { RequestContextInfo } from '../express';

export interface BaseTokenPayload {
  sub: string;
  jti: string;
}

export interface JwtClaims {
  iat?: number;
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string | string[];
}

export interface AccessTokenPayload extends BaseTokenPayload {
  email?: string;
  phoneNumber?: string;
  role: string;
  deviceId: string;
}

export interface RefreshTokenPayload extends BaseTokenPayload {
  requestContext: RequestContextInfo;
  ip?: string;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type TokenPayloadMap = {
  accessToken: AccessTokenPayload;
  refreshToken: RefreshTokenPayload;
};

export type TokenPayload = AccessTokenPayload | RefreshTokenPayload;
export interface JwtConfig {
  accessTokenSecret: string;
  accessTokenExpiresIn: SignOptions['expiresIn'];
  refreshTokenSecret: string;
  refreshTokenExpiresIn: SignOptions['expiresIn'];
  sessionTokenExpiresIn: string;
  issuer: string;
  audience: string;
}

export interface TokenMeta {
  key: string;
  requestContext: RequestContextInfo;
}

export type TokenMetaWithoutKey = Omit<TokenMeta, 'key'>;

export interface TokenRedisKey {
  JwtKey: string;
  indexKey: string;
  jtiIndexKey: string;
}

export type SignedToken = {
  token: string;
  expiresIn: number;
  jti: string;
  issuedAt?: string;
  scope?: string;
  tokenType?: string;
};

export interface SignedAccessToken extends SignedToken {
  scope?: 'access';
}

export interface SignedRefreshToken extends SignedToken {
  scope?: 'refresh';
  csrfToken: string;
  sessionId: string;
  expiresInSession: number;
}

export interface TokenPairResult {
  accessToken: SignedAccessToken;
  refreshToken: SignedRefreshToken;
}
