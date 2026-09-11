import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { SendOtpEmailResponseDto } from '@/modules/users/presentation/dto/response/send-otp-email-response.dto';

import { SendOtpUseCase } from '@/modules/users/application/use-cases/register/send-otp.usecase';
import { VerifyOtpAndRegisterUserUseCase } from '@/application/orchestrators/usecases/verifyOtp-and-register-user/verifyotp-and-register-user.useCase';
import { VerifiedUserResponseDto } from '@/application/orchestrators/dtos/response/verified-user-request.dto';
import { VerifiedUserRequestDto } from '@/application/orchestrators/dtos/request/verified-user-request.dto';
import { VerifiedUserMapper } from '@/application/orchestrators/mappers/verified-user.mapper';
import { SendOtpMapper } from '@/modules/users/presentation/mappers/generate-otp/generate-otp.mapper';
import { ValidateInputUserRequestDto } from '@/modules/users/presentation/dto/request/send-otp-request.dto';
import { UsernameValidationCode } from '@/modules/users/domain/policies/username.policy';
import { CheckUsernameAvailabilityUseCase } from '@/modules/users/application/use-cases/register/check-username-availability/check-username-availability.usecase';

export class CheckUsernameResponseDto {
  available!: boolean;
  username!: string;
  reason?: UsernameValidationCode | 'USERNAME_TAKEN';
  message?: string;
}

@ApiTags('Auth')
@Controller('auth/otp')
export class AuthController {
  private readonly signupCookieName = 'signup_session';

  constructor(
    private readonly sendOtpUseCase: SendOtpUseCase,
    private readonly verifyOtpAndRegisterUserUseCase: VerifyOtpAndRegisterUserUseCase,
    private readonly checkUsernameAvailability: CheckUsernameAvailabilityUseCase,
  ) {}

  @Get('check-username')
  @ApiOperation({
    summary: 'Check if username is available without duplicates',
  })
  @ApiQuery({ name: 'username', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Username availability result',
    type: CheckUsernameResponseDto,
  })
  async checkUsername(
    @Query('username') username: string,
  ): Promise<CheckUsernameResponseDto> {
    return this.checkUsernameAvailability.execute(username);
  }

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request OTP for authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP requested successfully',
    type: SendOtpEmailResponseDto,
  })
  async requestOtp(
    @Body() body: ValidateInputUserRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SendOtpEmailResponseDto> {
    const input = SendOtpMapper.toInput(body, req);
    const output = await this.sendOtpUseCase.execute(input);
    if (output.success && output.sessionToken && output.expiresIn) {
      this.setSignupCookie(res, output.sessionToken, output.expiresIn);
    }
    return SendOtpMapper.toResponse(output);
  }

  @Get('challenge')
  @ApiOperation({ summary: 'Get the current signup challenge status' })
  async challengeStatus(@Req() req: Request): Promise<SendOtpEmailResponseDto> {
    const output = await this.sendOtpUseCase.getStatus(
      req.cookies?.[this.signupCookieName] ?? '',
    );
    return SendOtpMapper.toResponse(output);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend signup OTP using the HttpOnly session cookie',
  })
  async resendOtp(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SendOtpEmailResponseDto> {
    const output = await this.sendOtpUseCase.resend(
      req.cookies?.[this.signupCookieName] ?? '',
      req.cookies?.deviceId ?? req.deviceId,
    );
    if (output.success && output.sessionToken && output.expiresIn) {
      this.setSignupCookie(res, output.sessionToken, output.expiresIn);
    }
    return SendOtpMapper.toResponse(output);
  }

  @Post('verify-register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP and register new user',
  })
  @ApiResponse({
    status: 200,
    type: VerifiedUserResponseDto,
  })
  async verifyAndRegister(
    @Body() body: VerifiedUserRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<VerifiedUserResponseDto> {
    const input = VerifiedUserMapper.toInput(
      body,
      req.cookies?.[this.signupCookieName] ?? '',
      req.cookies?.deviceId ?? req.deviceId,
    );

    const output = await this.verifyOtpAndRegisterUserUseCase.execute(input);

    if (output.success) this.clearSignupCookie(res);
    return VerifiedUserMapper.toResponse(output);
  }

  private setSignupCookie(
    res: Response,
    sessionToken: string,
    expiresIn: number,
  ): void {
    res.cookie(this.signupCookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/otp',
      maxAge: expiresIn * 1000,
    });
  }

  private clearSignupCookie(res: Response): void {
    res.clearCookie(this.signupCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/otp',
    });
  }
}
