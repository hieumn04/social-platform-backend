import { SendSlideMessageWithAttribution } from '@/types/typeModel/message';

export class SendMessageInput {
  constructor(
    public readonly senderId: string,
    public readonly sendSlideMessageWAttribute: SendSlideMessageWithAttribution,
  ) {}
}
