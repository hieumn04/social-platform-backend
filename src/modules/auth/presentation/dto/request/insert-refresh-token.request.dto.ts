import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InsertRefreshTokenRequestDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The refresh token string issued to the client',
  })
  @IsString()
  @IsNotEmpty()
  readonly refreshToken!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique JWT ID (jti) used to identify the token instance',
  })
  @IsUUID()
  @IsNotEmpty()
  readonly jti!: string;
}
