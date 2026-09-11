import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TokenPairResultDto } from './token/tokenpairresult-response.dto';
import { Type } from 'class-transformer';

export class LoginUserResponseDto {
  @ApiProperty({ example: 'User registered successfully' })
  @IsString()
  message!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({ type: TokenPairResultDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => TokenPairResultDto)
  tokens?: TokenPairResultDto;
}
