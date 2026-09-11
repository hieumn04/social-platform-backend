import { Injectable } from '@nestjs/common';
import { sha256Base64 } from 'src/helpers/helper';
import {
  CompareResult,
  Fingerprint,
  SessionCompareContext,
} from 'src/types/token/refreshToken.props';

@Injectable()
export class SessionService {
  constructor() {}

  private safeJoin(values: (string | null | undefined)[]): string {
    return values.map((v) => v || '').join('|');
  }
  buildFingerprint(info: SessionCompareContext): Fingerprint {
    const level1Str = this.safeJoin([
      info.deviceId,
      info.deviceInfo?.os,
      info.deviceInfo?.browser,
      info.deviceInfo?.platform,
    ]);

    const level2Str = this.safeJoin([
      info.deviceInfo?.version,
      info.deviceInfo?.deviceType,
    ]);
    const level3Str = this.safeJoin([info.deviceInfo?.rawUserAgent]);

    return {
      level1: sha256Base64(level1Str),
      level2: sha256Base64(level2Str),
      level3: sha256Base64(level3Str),
      raw: info,
    };
  }
  compareUserAgent(stored: Fingerprint, current: Fingerprint): CompareResult {
    const differences: string[] = [];

    const isHardMatch = current.level1 === stored.level1;
    const isSoftMatch = current.level2 === stored.level2;

    let matchLevel: 'hard' | 'soft' | 'none' = 'none';
    if (isHardMatch) {
      matchLevel = 'hard';
    } else if (isSoftMatch) {
      matchLevel = 'soft';
    }

    if (!isHardMatch) {
      if (current.raw.deviceId !== stored.raw.deviceId)
        differences.push('Level1 - deviceId mismatch');
      if (current.raw.deviceInfo?.os !== stored.raw.deviceInfo?.os)
        differences.push('Level1 - os mismatch');
      if (current.raw.deviceInfo?.browser !== stored.raw.deviceInfo?.browser)
        differences.push('Level1 - browser mismatch');
      if (current.raw.deviceInfo?.platform !== stored.raw.deviceInfo?.platform)
        differences.push('Level1 - platform mismatch');
    }

    // Level 2 differences
    if (!isSoftMatch) {
      if (current.raw.deviceInfo?.version !== stored.raw.deviceInfo?.version)
        differences.push('Level2 - version mismatch');
      if (
        current.raw.deviceInfo?.deviceType !== stored.raw.deviceInfo?.deviceType
      )
        differences.push('Level2 - deviceType mismatch');
    }

    if (current.level3 !== stored.level3) {
      if (
        current.raw.deviceInfo?.rawUserAgent !==
        stored.raw.deviceInfo?.rawUserAgent
      )
        differences.push('Level3 - rawUserAgent changed');
    }

    return {
      isHardMatch,
      isSoftMatch,
      differences,
      matchLevel,
    };
  }
}
