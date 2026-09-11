import { InsertMessageDto } from '@/modules/message/infrastructure/repositories/message-write.repository';
import { MessageType } from '@/shared/enums/message.enum';
import { BaseSendMessageInput } from '@/types/typeModel/message';

export class MessageRawMapper {
  static mapToInsertMessageDto(
    input: BaseSendMessageInput,
    metadata: {
      messageId: string;
      threadId: string;
      senderFbid: string;
      timestampMs: number;
    },
  ): InsertMessageDto {
    return {
      messageId: metadata.messageId,
      threadId: metadata.threadId,
      senderFbid: metadata.senderFbid,
      timestampMs: metadata.timestampMs,
      clientContext: input.clientMessageId,
      contentType: input.contentType,
      textBody: input.text,
      snippet: input.snippet ?? input.text,
      payload: input.payload,
      clientTimestampMs: input.clientMessageId
        ? /^\d+$/.test(input.clientMessageId)
          ? input.clientMessageId
          : undefined
        : undefined,
    };
  }
}
