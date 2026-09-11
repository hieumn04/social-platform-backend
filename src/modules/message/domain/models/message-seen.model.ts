import { MessageSeenProps } from '@/types/typeModel/message';

export class MessageSeen {
  constructor(
    public readonly messageId: string,
    private props: MessageSeenProps,
  ) {}

  public toObject(): { messageId: string } & MessageSeenProps {
    return {
      messageId: this.messageId,
      ...this.props,
    };
  }
  public static restore(
    messageId: string,
    props: MessageSeenProps,
  ): MessageSeen {
    return new MessageSeen(messageId, props);
  }

  public static createNew(
    messageId: string,
    params: {
      conversationId: string;
      userId: string;
      seenAt?: Date;
    },
  ): MessageSeen {
    if (!messageId) throw new Error('MessageId is required');
    if (!params.conversationId) throw new Error('ConversationId is required');
    if (!params.userId) throw new Error('UserId is required');

    return new MessageSeen(messageId, {
      conversationId: params.conversationId,
      userId: params.userId,
      seenAt: params.seenAt ?? new Date(),
    });
  }

  public advanceSeenAt(newSeenAt: Date): void {
    if (newSeenAt <= this.props.seenAt) return;
    this.props.seenAt = newSeenAt;
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get seenAt(): Date {
    return this.props.seenAt;
  }
}
