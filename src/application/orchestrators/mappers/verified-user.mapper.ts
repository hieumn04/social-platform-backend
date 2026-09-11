import { VerifiedUserRequestDto } from '@/application/orchestrators/dtos/request/verified-user-request.dto';
import { VerifiedUserResponseDto } from '@/application/orchestrators/dtos/response/verified-user-request.dto';
import { VerifyOtpInput } from '@/application/orchestrators/usecases/verifyOtp-and-register-user/verifyotp.input';
import { VerifyOtpOutput } from '@/application/orchestrators/usecases/verifyOtp-and-register-user/verifyotp.output';

export class VerifiedUserMapper {
  static toInput(
    dto: VerifiedUserRequestDto,
    sessionToken: string,
    deviceId: string,
  ): VerifyOtpInput {
    return new VerifyOtpInput(dto.otpEnter, sessionToken, deviceId);
  }

  static toResponse(output: VerifyOtpOutput): VerifiedUserResponseDto {
    return {
      success: output.success,
      message: output.message,
      purpose: output.purpose!,
      userId: output.userId,
    };
  }
}
