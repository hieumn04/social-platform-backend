import { VerifyOtpInput } from 'src/modules/users/application/use-cases/register/verify-otp/verifyotp.input';
import { VerifiedUserRequestDto } from '../../dto/request/verified-user-request.dto';
import { VerifyOtpOutput } from 'src/modules/users/application/use-cases/register/verify-otp/verifyotp.output';
import { VerifiedUserResponsetDto } from '../../dto/response/verified-user-request.dto';
import { Method } from 'src/shared/enums/statusRegister.enum';

export class VerifiedMapper {
  static toInput(dto: VerifiedUserRequestDto): VerifyOtpInput {
    return new VerifyOtpInput(dto.otpEnter, dto.jti);
  }

  static toResponse(output: VerifyOtpOutput): VerifiedUserResponsetDto {
    return {
      message: output.message,
      purpose: output.purpose ?? Method.REGISTER,
      success: output.success,
    };
  }
}
