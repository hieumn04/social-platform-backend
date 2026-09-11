import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class TypingWsDto {
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsBoolean()
  isTyping!: boolean;
}
