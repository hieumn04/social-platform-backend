import { SendSlideMessageInput } from '@/types/typeModel/message';

export class SendFirstMessageInput {
  constructor(
    public readonly senderId: string,
    public readonly sendSlideMessageInput: SendSlideMessageInput,
  ) {}
}
