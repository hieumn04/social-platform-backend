import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Method } from 'src/shared/enums/statusRegister.enum';
import { Gender } from 'src/shared/enums/gender.enum';

export class ValidateInputUserRequestDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  fullname!: string;

  @ApiProperty({
    description: 'Username for the account',
    example: 'johndoe123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  name!: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'StrongPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    description: 'User email address (optional)',
    example: 'johndoe@gmail.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (optional)',
    example: '+14155552671',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Gender of the user',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Purpose of OTP request',
    enum: Method,
    example: Method.REGISTER,
  })
  @IsNotEmpty()
  @IsEnum(Method)
  purpose!: Method;
}
