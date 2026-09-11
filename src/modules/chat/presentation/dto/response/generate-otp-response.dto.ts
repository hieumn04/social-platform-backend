import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateOtpResponseDto {
  @ApiPropertyOptional({ example: 'uuid-string' })
  jti?: string;

  @ApiPropertyOptional({ example: '2025-07-27T19:00:00.000Z' })
  expiresAt?: string;

  @ApiPropertyOptional({ example: 300 })
  expiresIn?: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'OTP generated successfully' })
  message!: string;
}
