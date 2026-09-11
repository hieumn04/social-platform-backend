import { SendMessageRequestDto } from '@/application/orchestrators/dtos/request/send-message-request.dto';
import { SendMessageInput } from '@/application/orchestrators/usecases/message/messageuserinput';

export class SendMessageMapper {
  static toInput(dto: SendMessageRequestDto, userId: string): SendMessageInput {
    return new SendMessageInput(userId, dto.receiverId, dto.content);
  }
}
