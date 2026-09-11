import { SendOtpOutput } from '@/modules/users/application/use-cases/register/send-otp.output';
import { ValidateInputUser } from 'src/modules/users/application/use-cases/register/validate-input-user.ts/input';
import { Request } from 'express';
import { UserRegisterInput } from 'src/types/typeModel/userProp';
import { ValidateInputUserRequestDto } from '@/modules/users/presentation/dto/request/send-otp-request.dto';
import { SendOtpEmailResponseDto } from '@/modules/users/presentation/dto/response/send-otp-email-response.dto';

export class SendOtpMapper {
  static toInput(
    body: ValidateInputUserRequestDto,
    req: Request,
  ): ValidateInputUser {
    const userRegister: UserRegisterInput = {
      fullName: body.fullName,
      username: body.username,
      email: body.email,
      password: body.password,
      phoneNumber: body.phoneNumber,
      gender: body.gender,
    };
    return new ValidateInputUser(
      userRegister,
      body.purpose,
      req.ip,
      req.deviceId,
    );
  }

  static toResponse(output: SendOtpOutput): SendOtpEmailResponseDto {
    return {
      success: output.success,
      message: output.message,
      maskedEmail: output.maskedEmail,
      expiresAt: output.expiresAt,
      expiresIn: output.expiresIn,
      resendAfter: output.resendAfter,
      errorCode: output.errorCode,
      retryable: output.retryable,
    };
  }
}
