import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpEmailResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: ' Send OTP  successfully' })
  message!: string;

  @ApiPropertyOptional({ example: 'SENDGRID_ERROR' })
  errorCode?: string;

  @ApiPropertyOptional({ example: false })
  retryable?: boolean;
}
