import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserRequestDto {
  @ApiProperty({
    description: 'User account identifier (email, phone number, or username)',
    example: 'john.doe@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  accountname!: string;

  @ApiProperty({
    description: 'User password',
    example: 'P@ssw0rd123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}
