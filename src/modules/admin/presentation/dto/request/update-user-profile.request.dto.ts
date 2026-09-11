import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from '../../../../../shared/enums/gender.enum';

export class UpdateUserProfileRequestDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    type: String,
    description: 'Họ tên đầy đủ của người dùng',
  })
  @IsOptional()
  @IsString()
  fullname!: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  address!: string;

  @ApiPropertyOptional({
    enum: Gender,
  })
  @IsEnum(Gender)
  gender?: Gender;
}
