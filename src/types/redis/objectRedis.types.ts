export interface RedisSessionData {
  deviceId?: string;
  ip?: string;
  deviceInfo?: string;
  rawUserAgent: string;
  platform: string;
  os: string;
  browser: string;
  version: string;
  deviceType: string;
}
