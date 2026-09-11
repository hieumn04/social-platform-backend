import { Injectable } from '@nestjs/common';

import { AppLogger } from '@/shared/logger/applogger';
import { OtpService } from '@/shared/redis/otp/otp.service';
import { SendOtpEmailUseCase } from './send-otp-email-bymail/send-otp-email-byemail.usecase';
import { SendOtpOutput } from './send-otp.output';
import { ValidateInputUser } from './validate-input-user.ts/input';
import { ValidateInputUserUseCase } from './validate-input-user.ts/validate-input-user.usecase';

@Injectable()
export class SendOtpUseCase {
  constructor(
    private readonly validateInputUser: ValidateInputUserUseCase,
    private readonly otpService: OtpService,
    private readonly sendOtpEmail: SendOtpEmailUseCase,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: ValidateInputUser): Promise<SendOtpOutput> {
    const validation = await this.validateInputUser.execute(input);
    if (!validation.isValid || !validation.userRegisterResult) {
      return new SendOtpOutput(
        false,
        validation.message ?? 'Invalid registration information',
      );
    }

    const email = validation.userRegisterResult.email?.getValue();
    if (!email) {
      return new SendOtpOutput(
        false,
        'Email is required for this registration flow',
      );
    }

    const challenge = await this.otpService.createSignupChallenge(
      validation.userRegisterResult,
      input.purpose,
      input.deviceId,
    );
    const sendResult = await this.sendOtpEmail.execute({
      to: email,
      otp: challenge.otp,
      subject: 'Verify your account registration',
    });

    if (!sendResult.success) {
      await this.otpService.deleteSignupChallenge(challenge.sessionToken);
      this.logger.warn('Signup OTP email could not be sent', {
        errorCode: sendResult.errorCode,
      });
      return new SendOtpOutput(
        false,
        sendResult.message,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        sendResult.errorCode,
        sendResult.retryable,
      );
    }

    return new SendOtpOutput(
      true,
      'OTP email sent successfully',
      challenge.sessionToken,
      this.maskEmail(email),
      challenge.expiresAt,
      challenge.expiresIn,
      challenge.resendAfter,
    );
  }

  async resend(sessionToken: string, deviceId: string): Promise<SendOtpOutput> {
    const result = await this.otpService.resendSignupChallenge(
      sessionToken,
      deviceId,
    );
    if (!result.success) {
      const message =
        result.reason === 'TOO_EARLY'
          ? `Please wait ${result.retryAfter} seconds before requesting another OTP`
          : result.reason === 'DEVICE_MISMATCH'
            ? 'Signup session does not belong to this device'
            : 'Signup session is missing or expired';
      return new SendOtpOutput(
        false,
        message,
        undefined,
        undefined,
        undefined,
        undefined,
        result.retryAfter,
      );
    }

    const email = result.userInfo.email?.getValue();
    if (!email) {
      await this.otpService.deleteSignupChallenge(
        result.challenge.sessionToken,
      );
      return new SendOtpOutput(false, 'Email is missing from signup session');
    }
    const sendResult = await this.sendOtpEmail.execute({
      to: email,
      otp: result.challenge.otp,
      subject: 'Your new account verification code',
    });
    if (!sendResult.success) {
      await this.otpService.deleteSignupChallenge(
        result.challenge.sessionToken,
      );
      return new SendOtpOutput(
        false,
        sendResult.message,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        sendResult.errorCode,
        sendResult.retryable,
      );
    }
    return new SendOtpOutput(
      true,
      'A new OTP was sent successfully',
      result.challenge.sessionToken,
      this.maskEmail(email),
      result.challenge.expiresAt,
      result.challenge.expiresIn,
      result.challenge.resendAfter,
    );
  }

  async getStatus(sessionToken: string): Promise<SendOtpOutput> {
    const challenge = await this.otpService.getSignupChallenge(sessionToken);
    const email = challenge?.userInfo.email?.getValue();
    if (!challenge || !email) {
      return new SendOtpOutput(false, 'Signup session is missing or expired');
    }
    return new SendOtpOutput(
      true,
      'Signup session is active',
      undefined,
      this.maskEmail(email),
      new Date(challenge.expiresAt).toISOString(),
      this.otpService.getRemainingSeconds(challenge.expiresAt),
      this.otpService.getRemainingSeconds(challenge.resendAvailableAt),
    );
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
  }
}
