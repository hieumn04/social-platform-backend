import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Method } from 'src/shared/enums/statusRegister.enum';

export class VerifiedUserResponsetDto {
  @ApiProperty({
    description: 'Purpose of OTP request',
    enum: Method,
    example: Method.REGISTER,
  })
  @IsNotEmpty()
  @IsEnum(Method)
  purpose!: Method;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'OTP Valid' })
  @IsNotEmpty()
  @IsString()
  message!: string;
}
