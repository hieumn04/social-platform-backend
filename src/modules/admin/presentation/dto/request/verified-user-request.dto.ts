import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifiedUserRequestDto {
  @ApiProperty({
    example: '12345',
    description: 'OTP code entered by the user',
  })
  @IsString()
  @IsNotEmpty()
  otpEnter!: string;

  @ApiProperty({
    example: 'some-unique-jti',
    description: 'JWT ID to track the OTP session',
  })
  @IsString()
  @IsNotEmpty()
  jti!: string;
}
