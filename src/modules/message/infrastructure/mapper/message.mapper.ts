import {
  BaseSendMessageInput,
  SendSlideMessageInput,
  SendSlideMessageWithAttribution,
} from '@/types/typeModel/message';
import { MessageType } from '@/shared/enums/message.enum';

export class SendMessageInputAdapter {
  static fromIG(
    input: SendSlideMessageInput | SendSlideMessageWithAttribution,
  ): BaseSendMessageInput {
    return {
      clientMessageId: input.offline_threading_id,

      text: input.text?.sensitive_string_value,

      replyToMessageId:
        input.reply_to_message_id ?? input.replied_to_item_id ?? undefined,
      contentType: input.content_type ?? MessageType.TEXT,
    };
  }
}
