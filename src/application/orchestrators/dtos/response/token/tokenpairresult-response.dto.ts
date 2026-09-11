import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { SignedTokenDto } from './signedtoken-response.dto';
import { Type } from 'class-transformer';

export class TokenPairResultDto {
  @ApiProperty({ type: SignedTokenDto })
  @ValidateNested()
  @Type(() => SignedTokenDto)
  accessToken!: SignedTokenDto;

  @ApiProperty({ type: SignedTokenDto })
  @ValidateNested()
  @Type(() => SignedTokenDto)
  refreshToken!: SignedTokenDto;
}
