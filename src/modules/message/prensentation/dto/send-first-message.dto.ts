import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendFirstMessageDto {
  @ApiProperty({ description: 'ID của người nhận tin nhắn (ví dụ FBID của bạn kia)' })
  @IsString()
  @IsNotEmpty()
  recipientFbid!: string;

  @ApiProperty({ description: 'Nội dung tin nhắn text cần gửi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;

  @ApiProperty({ description: 'Khóa UUID sinh từ Client App chống rớt mạng duplicate' })
  @IsString()
  @IsNotEmpty()
  clientContext!: string;
}
