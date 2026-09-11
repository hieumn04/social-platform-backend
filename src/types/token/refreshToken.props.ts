import { UserAgent } from 'src/modules/auth/domain/value-objects/user-agent.vo';
import { RequestContextInfo, UserAgentResult } from '../express';

export interface RefreshTokenProps {
  refreshToken: string;
  jti: string;
  expiredAt: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  rotatedAt?: Date;
  userId: string;
  ipAddress?: string;
  userAgent: UserAgent;
  deviceId?: string;
  isRevoked?: boolean;
  fingerprint?: string;
}

export interface RefreshTokenPersistenceProps {
  refreshToken: string;
  jti: string;
  expiredAt: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  rotatedAt?: Date;
  userId: string;
  ipAddress?: string;
  userAgent: UserAgentResult | null;
  deviceId?: string;
  isRevoked?: boolean;
  fingerprint?: string;
}

export interface CompareResult {
  isHardMatch: boolean;
  isSoftMatch: boolean;
  differences: string[];
  matchLevel: 'hard' | 'soft' | 'none';
}

export type SessionCompareContext = Pick<
  RequestContextInfo,
  'deviceInfo' | 'deviceId' | 'ip'
> & {};

export interface Fingerprint {
  level1: string;
  level2: string;
  level3: string;
  raw: SessionCompareContext;
}
