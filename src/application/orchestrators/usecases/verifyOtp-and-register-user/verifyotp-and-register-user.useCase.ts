import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { VerifyOtpInput } from './verifyotp.input';
import { VerifyOtpOutput } from './verifyotp.output';
import { GenerateMessagingIdentityUseCase } from '@/modules/message/application/use-cases/generate-messaging-Identity/generateMessagingIdentity.usecase';
import { GenerateUserIdentityUseCase } from '@/modules/users/application/use-cases/create-user-identity/create-user-identity.usecase';
import { CreateNewUserInput } from '@/modules/users/application/use-cases/register/createnewuser/createNewUser.input';
import { CreateNewUserUseCase } from '@/modules/users/application/use-cases/register/createnewuser/createnewUser.usecase';
import { Gender } from '@/shared/enums/gender.enum';
import { Method } from '@/shared/enums/statusRegister.enum';
import { OtpService } from '@/shared/redis/otp/otp.service';

@Injectable()
export class VerifyOtpAndRegisterUserUseCase {
  constructor(
    private readonly otpService: OtpService,
    private readonly createNewUser: CreateNewUserUseCase,
    private readonly generateUserIdentityUseCase: GenerateUserIdentityUseCase,
    private readonly generateMessagingIdentityUseCase: GenerateMessagingIdentityUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
    const verified = await this.otpService.verifySignupChallenge(
      input.sessionToken,
      input.otpEnter,
      input.deviceId,
    );

    if (!verified.success) {
      const messages = {
        INVALID_SESSION: 'Signup session is missing or expired',
        DEVICE_MISMATCH: 'Signup session does not belong to this device',
        INVALID_OTP: 'OTP is invalid',
      } as const;
      return new VerifyOtpOutput(messages[verified.reason], false);
    }

    const { userInfo } = verified.challenge;
    const { email, phoneNumber } = userInfo;
    if (!email && !phoneNumber) {
      return new VerifyOtpOutput('No registration identifier found', false);
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const { identityId } =
        await this.generateUserIdentityUseCase.execute(manager);
      const userResult = await this.createNewUser.execute(
        new CreateNewUserInput({
          identityId,
          fullName: userInfo.fullName,
          username: userInfo.username,
          passwordHash: userInfo.passwordHash,
          gender: userInfo.gender ?? Gender.OTHER,
          phoneNumber,
          email,
          accountCountry: 'VN',
        }),
        manager,
      );

      if (!userResult.success || !userResult.userId) {
        throw new Error(userResult.message || 'Create user failed');
      }
      await this.generateMessagingIdentityUseCase.execute(
        userResult.userId,
        manager,
      );
      return userResult;
    });

    if (result.success) {
      await this.otpService.deleteSignupChallenge(input.sessionToken, userInfo);
    }

    return new VerifyOtpOutput(
      result.message,
      result.success,
      Method.REGISTER,
      result.userId,
    );
  }
}
