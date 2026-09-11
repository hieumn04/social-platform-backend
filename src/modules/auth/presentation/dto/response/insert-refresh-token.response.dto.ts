import { ApiProperty } from '@nestjs/swagger';

export class InsertRefreshTokenResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the insert operation was successful',
  })
  readonly success!: boolean;

  @ApiProperty({
    example: 'Refresh token inserted successfully',
    description: 'Message describing the result of the operation',
  })
  readonly message!: string;
}
