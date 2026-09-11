import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponseDto {
  @ApiProperty({ example: 'Successfully refreshed access token' })
  message!: string;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'abc123...', required: false })
  accessToken?: string;

  @ApiProperty({ example: 3600, required: false })
  expiresIn?: number;

  @ApiProperty({ example: 'jti123...', required: false })
  refreshJti?: string;
}
