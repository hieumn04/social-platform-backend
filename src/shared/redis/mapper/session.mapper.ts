import { UserAgentResult } from 'src/types/express';
import { RedisSessionData } from 'src/types/redis/objectRedis.types';
import { SessionCompareContext } from 'src/types/token/refreshToken.props';

export class SessionMapper {
  static toDomain(raw: RedisSessionData): SessionCompareContext {
    const deviceInfo: UserAgentResult = {
      browser: raw.browser,
      version: raw.version,
      os: raw.os,
      platform: raw.platform,
      deviceType: raw.deviceType,
      rawUserAgent: raw.rawUserAgent,
    };

    return {
      deviceId: raw.deviceId ?? '',
      ip: raw.ip ?? undefined,
      deviceInfo: deviceInfo,
    };
  }
}
