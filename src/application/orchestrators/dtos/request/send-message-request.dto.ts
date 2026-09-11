import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SendMessageRequestDto {
  @ApiProperty({
    description: 'ID of the user receiving the message',
    example: 'user-67890',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  receiverId!: string;

  @ApiProperty({
    description: 'Content of the message being sent',
    example: 'Hello, how are you doing today?',
    required: true,
    type: String,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content!: string;
}
