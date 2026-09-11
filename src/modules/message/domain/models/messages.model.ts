import { MessageType } from '@/shared/enums/message.enum';
import { MessageProps } from '@/types/typeModel/message';

export class Message {
  constructor(
    public readonly messageId: string,
    private props: MessageProps,
  ) {}

  /* ==============================
   * Factories
   * ============================== */

  static restore(id: string, props: MessageProps): Message {
    return new Message(id, props);
  }

  static createNew(
    id: string,
    params: {
      conversationId: string;
      senderId?: string;
      type: MessageType;
      content?: string;
      payload?: Record<string, any>;
      replyToMessageId?: string;
      clientMessageId?: string;
    },
  ): Message {
    if (!id) throw new Error('MessageId is required');

    const now = new Date();

    return new Message(id, {
      conversationId: params.conversationId,
      clientMessageId: params.clientMessageId ?? id,

      senderId: params.senderId,
      type: params.type,
      content: params.content,
      payload: params.payload,
      replyToMessageId: params.replyToMessageId,

      isDeleted: false,
      deletedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  }

  /* ==============================
   * Domain behavior
   * ============================== */

  delete(): void {
    if (this.props.isDeleted) return;

    this.props.isDeleted = true;
    this.props.deletedAt = new Date();
    this.props.content = undefined;
    this.props.payload = undefined;
    this.touch();
  }

  editContent(content: string): void {
    if (this.props.isDeleted) throw new Error('Cannot edit deleted message');

    this.props.content = content;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  /* ==============================
   * Getters
   * ============================== */

  get id(): string {
    return this.messageId;
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get clientMessageId(): string {
    return this.props.clientMessageId;
  }

  get senderId(): string | undefined {
    return this.props.senderId;
  }

  get type(): MessageType {
    return this.props.type;
  }

  get content(): string | undefined {
    return this.props.content;
  }

  get payload(): Record<string, any> | undefined {
    return this.props.payload;
  }

  get replyToMessageId(): string | undefined {
    return this.props.replyToMessageId;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /* ==============================
   * Snapshot
   * ============================== */

  toSnapshot(): { messageId: string } & MessageProps {
    return {
      messageId: this.messageId,
      ...this.props,
    };
  }
}
