import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageWsDto {
  @IsString()
  @IsNotEmpty()
  receiverId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
