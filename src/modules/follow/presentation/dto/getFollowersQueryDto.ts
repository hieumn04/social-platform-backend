import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFollowersQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  viewerId?: string;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    example: '2026-02-12T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  cursorCreatedAt?: string;

  @ApiPropertyOptional({
    example: '998',
  })
  @IsOptional()
  @IsString()
  cursorFollowerId?: string;
}
