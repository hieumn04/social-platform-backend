import { Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

import { normalizeUserRegisterFields } from '@/helpers/object';
import { Email } from '@/modules/value-objects/email';
import { Password } from '@/modules/value-objects/password';
import { PhoneNumber } from '@/modules/value-objects/phonenumber';
import { NestConfigService } from '@/shared/config/config.service';
import { Method } from '@/shared/enums/statusRegister.enum';
import { AppLogger } from '@/shared/logger/applogger';
import { RedisService } from '@/shared/redis/redis.service';
import { generateOtp } from '@/seeds/untils/otp/otp.util';
import { UserRegisterFields } from '@/types/typeModel/userProp';

type StoredSignupChallenge = Record<string, string | number | null>;

export interface SignupChallenge {
  userInfo: UserRegisterFields;
  purpose: Method;
  expiresAt: number;
  resendAvailableAt: number;
}

export type VerifySignupChallengeResult =
  | { success: true; challenge: SignupChallenge }
  | {
      success: false;
      reason: 'INVALID_SESSION' | 'DEVICE_MISMATCH' | 'INVALID_OTP';
    };

export type ResendSignupChallengeResult =
  | {
      success: true;
      challenge: Awaited<ReturnType<OtpService['createSignupChallenge']>>;
      userInfo: UserRegisterFields;
    }
  | {
      success: false;
      reason: 'INVALID_SESSION' | 'DEVICE_MISMATCH' | 'TOO_EARLY';
      retryAfter?: number;
    };

@Injectable()
export class OtpService {
  readonly expiresInSeconds = 60 * 10;
  readonly resendAfterSeconds = 60;
  private readonly maxAttempts = 5;
  private readonly redisType = 'cacheRedis' as const;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: NestConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('OtpService');
  }

  async createSignupChallenge(
    userInfo: UserRegisterFields,
    purpose: Method,
    deviceId: string,
  ): Promise<{
    sessionToken: string;
    otp: string;
    expiresAt: string;
    expiresIn: number;
    resendAfter: number;
  }> {
    const sessionToken = randomBytes(32).toString('base64url');
    const otp = generateOtp(6);
    const otpSalt = randomBytes(16).toString('hex');
    const challengeKey = this.buildChallengeKey(sessionToken);
    const identifier = this.getIdentifier(userInfo);
    const activeKey = this.buildActiveKey(identifier);
    const previousChallengeKey = await this.redisService.get<string>(
      activeKey,
      this.redisType,
    );
    const now = Date.now();
    const expiresAt = now + this.expiresInSeconds * 1000;
    const resendAvailableAt = now + this.resendAfterSeconds * 1000;
    const fields: Record<string, string | number> = {
      ...normalizeUserRegisterFields(userInfo),
      purpose,
      otpHash: this.hashOtp(otp, otpSalt),
      otpSalt,
      deviceIdHash: this.hashValue(deviceId),
      attemptCount: 0,
      expiresAt,
      resendAvailableAt,
    };

    const multi = this.redisService.multi(this.redisType);
    if (previousChallengeKey) {
      void this.redisService.del(previousChallengeKey, this.redisType, multi);
    }
    this.redisService.hashSet(
      {
        key: challengeKey,
        fields,
        ttlSeconds: this.expiresInSeconds,
      },
      multi,
      this.redisType,
    );
    this.redisService.set(
      {
        key: activeKey,
        value: challengeKey,
        ttl: this.expiresInSeconds,
        type: this.redisType,
      },
      multi,
    );
    await this.redisService.execMulti(multi);

    return {
      sessionToken,
      otp,
      expiresAt: new Date(expiresAt).toISOString(),
      expiresIn: this.expiresInSeconds,
      resendAfter: this.resendAfterSeconds,
    };
  }

  async getSignupChallenge(
    sessionToken: string,
  ): Promise<SignupChallenge | null> {
    if (!sessionToken) return null;
    const raw = await this.redisService.hashGetAllFields(
      this.buildChallengeKey(sessionToken),
      this.redisType,
      ['attemptCount', 'expiresAt', 'resendAvailableAt'],
    );
    return this.toSignupChallenge(raw as StoredSignupChallenge);
  }

  async verifySignupChallenge(
    sessionToken: string,
    otp: string,
    deviceId: string,
  ): Promise<VerifySignupChallengeResult> {
    if (!sessionToken || !otp || !deviceId) {
      return { success: false, reason: 'INVALID_SESSION' };
    }

    const key = this.buildChallengeKey(sessionToken);
    const raw = (await this.redisService.hashGetAllFields(key, this.redisType, [
      'attemptCount',
      'expiresAt',
      'resendAvailableAt',
    ])) as StoredSignupChallenge;
    const challenge = this.toSignupChallenge(raw);

    if (!challenge || Number(raw.expiresAt) <= Date.now()) {
      await this.deleteSignupChallenge(sessionToken);
      return { success: false, reason: 'INVALID_SESSION' };
    }
    if (!(await this.isActiveChallenge(key, challenge.userInfo))) {
      await this.redisService.del(key, this.redisType);
      return { success: false, reason: 'INVALID_SESSION' };
    }

    if (
      !this.safeEqual(String(raw.deviceIdHash ?? ''), this.hashValue(deviceId))
    ) {
      return { success: false, reason: 'DEVICE_MISMATCH' };
    }

    const expectedOtpHash = String(raw.otpHash ?? '');
    const actualOtpHash = this.hashOtp(otp, String(raw.otpSalt ?? ''));
    if (!this.safeEqual(expectedOtpHash, actualOtpHash)) {
      const attempts = await this.redisService.hashIncrement(
        key,
        'attemptCount',
        1,
        this.redisType,
      );
      if (attempts >= this.maxAttempts) {
        await this.deleteSignupChallenge(sessionToken, challenge.userInfo);
      }
      return { success: false, reason: 'INVALID_OTP' };
    }

    return { success: true, challenge };
  }

  async resendSignupChallenge(
    sessionToken: string,
    deviceId: string,
  ): Promise<ResendSignupChallengeResult> {
    if (!sessionToken || !deviceId) {
      return { success: false, reason: 'INVALID_SESSION' };
    }
    const raw = (await this.redisService.hashGetAllFields(
      this.buildChallengeKey(sessionToken),
      this.redisType,
      ['attemptCount', 'expiresAt', 'resendAvailableAt'],
    )) as StoredSignupChallenge;
    const current = this.toSignupChallenge(raw);
    if (!current || current.expiresAt <= Date.now()) {
      await this.deleteSignupChallenge(sessionToken);
      return { success: false, reason: 'INVALID_SESSION' };
    }
    const challengeKey = this.buildChallengeKey(sessionToken);
    if (!(await this.isActiveChallenge(challengeKey, current.userInfo))) {
      await this.redisService.del(challengeKey, this.redisType);
      return { success: false, reason: 'INVALID_SESSION' };
    }
    if (
      !this.safeEqual(String(raw.deviceIdHash ?? ''), this.hashValue(deviceId))
    ) {
      return { success: false, reason: 'DEVICE_MISMATCH' };
    }
    const retryAfter = this.getRemainingSeconds(current.resendAvailableAt);
    if (retryAfter > 0) {
      return { success: false, reason: 'TOO_EARLY', retryAfter };
    }
    const challenge = await this.createSignupChallenge(
      current.userInfo,
      current.purpose,
      deviceId,
    );
    return { success: true, challenge, userInfo: current.userInfo };
  }

  async deleteSignupChallenge(
    sessionToken: string,
    knownUserInfo?: UserRegisterFields,
  ): Promise<void> {
    if (!sessionToken) return;
    const challengeKey = this.buildChallengeKey(sessionToken);
    const challenge = knownUserInfo
      ? { userInfo: knownUserInfo }
      : await this.getSignupChallenge(sessionToken);
    const keys = [challengeKey];
    if (challenge?.userInfo) {
      const activeKey = this.buildActiveKey(
        this.getIdentifier(challenge.userInfo),
      );
      const activeChallengeKey = await this.redisService.get<string>(
        activeKey,
        this.redisType,
      );
      if (activeChallengeKey === challengeKey) keys.push(activeKey);
    }
    await this.redisService.del(keys, this.redisType);
  }

  getRemainingSeconds(expiresAt: number): number {
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  }

  private toSignupChallenge(
    raw: StoredSignupChallenge | null,
  ): SignupChallenge | null {
    if (!raw || !raw.passwordHash || !raw.username || !raw.fullName)
      return null;
    try {
      const email = raw.email
        ? Email.fromPersistence(String(raw.email))
        : undefined;
      const phoneNumber = raw.phoneNumber
        ? PhoneNumber.fromPersistence(String(raw.phoneNumber))
        : undefined;
      return {
        userInfo: {
          email,
          phoneNumber,
          username: String(raw.username),
          fullName: String(raw.fullName),
          passwordHash: Password.fromHash(String(raw.passwordHash)),
          gender: raw.gender as UserRegisterFields['gender'],
        },
        purpose: raw.purpose as Method,
        expiresAt: Number(raw.expiresAt),
        resendAvailableAt: Number(raw.resendAvailableAt),
      };
    } catch (error) {
      this.logger.warn('Invalid signup challenge found in Redis', { error });
      return null;
    }
  }

  private getIdentifier(userInfo: UserRegisterFields): string {
    const identifier =
      userInfo.email?.getValue() ?? userInfo.phoneNumber?.getValue();
    if (!identifier) throw new Error('Signup challenge requires an identifier');
    return identifier.trim().toLowerCase();
  }

  private buildChallengeKey(sessionToken: string): string {
    return `signup:challenge:${this.hashValue(sessionToken)}`;
  }

  private buildActiveKey(identifier: string): string {
    return `signup:active:${this.hashValue(identifier)}`;
  }

  private async isActiveChallenge(
    challengeKey: string,
    userInfo: UserRegisterFields,
  ): Promise<boolean> {
    const activeKey = this.buildActiveKey(this.getIdentifier(userInfo));
    const activeChallengeKey = await this.redisService.get<string>(
      activeKey,
      this.redisType,
    );
    return activeChallengeKey === challengeKey;
  }

  private hashOtp(otp: string, salt: string): string {
    const secret =
      process.env.OTP_HMAC_SECRET || this.configService.jwt.accessTokenSecret;
    return createHmac('sha256', secret)
      .update(`${salt}:${otp}`)
      .digest('hex');
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}
