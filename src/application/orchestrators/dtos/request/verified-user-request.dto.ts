import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifiedUserRequestDto {
  @ApiProperty({
    example: '123456',
    description: 'OTP code entered by the user',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'otpEnter must contain exactly 6 digits' })
  otpEnter!: string;
}
