import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SignedTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 3600, description: 'Expiration time in seconds' })
  @IsNumber()
  expiresIn!: number;

  @ApiProperty({ example: 'unique-jti-12345' })
  @IsString()
  jti!: string;

  @ApiPropertyOptional({ example: '2025-08-12T09:00:00Z', required: false })
  @IsOptional()
  @IsString()
  issuedAt?: string;

  @ApiPropertyOptional({ example: 'access', required: false })
  @IsOptional()
  @IsString()
  scope?: string;
}
