import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpEmailResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: ' Send OTP  successfully' })
  message!: string;

  @ApiPropertyOptional({ example: 'jo*****@gmail.com' })
  maskedEmail?: string;

  @ApiPropertyOptional({ example: '2026-09-11T12:10:00.000Z' })
  expiresAt?: string;

  @ApiPropertyOptional({ example: 600 })
  expiresIn?: number;

  @ApiPropertyOptional({ example: 60 })
  resendAfter?: number;

  @ApiPropertyOptional({ example: 'SENDGRID_ERROR' })
  errorCode?: string;

  @ApiPropertyOptional({ example: false })
  retryable?: boolean;
}
