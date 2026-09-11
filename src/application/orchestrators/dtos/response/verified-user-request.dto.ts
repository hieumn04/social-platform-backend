import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Method } from 'src/shared/enums/statusRegister.enum';

export class VerifiedUserResponseDto {
  @ApiProperty({
    description: 'Purpose of OTP request',
    enum: Method,
    example: Method.REGISTER,
  })
  purpose?: Method;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'OTP Valid' })
  message!: string;

  @ApiPropertyOptional({ example: '329734922971385856' })
  userId?: string;
}
