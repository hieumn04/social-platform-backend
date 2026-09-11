import { Tenant } from 'src/tenants/tenants.interface';
import {
  CompareResult,
  SessionCompareContext,
} from './token/refreshToken.props';
import { SessionData } from './session/Session';

export interface UserAgentResult {
  platform: string;
  os: string;
  browser: string;
  version: string;
  rawUserAgent: string;
  deviceType?: string;
}

export interface RequestContextInfo {
  deviceInfo?: UserAgentResult;
  deviceId: string;
  requestId?: string;
  ip?: string;
  startTime?: number;
  geo?: { country: string };
}

declare module 'express' {
  export interface Request {
    // tenant?: Tenant;
    requestId: string;
    ip: string;
    geo?: { country: string };
    startTime: number;
    deviceInfo: UserAgentResult;
    cookies: {
      deviceId?: string;
      refreshToken?: string;
      [key: string]: string;
    };
    deviceId: string;
    sessionContext?: SessionCompareContext;
    compareResult?: CompareResult;
    session?: SessionData;
  }
}
