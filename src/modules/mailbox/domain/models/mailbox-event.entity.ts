import { MailboxEventType } from "@/modules/mailbox/domain/enums/mailbox-event-type.enum";

export interface MailboxEventProps {
  seq?: string;
  userId: string;
  threadId: string;
  eventType: MailboxEventType;
  messageId?: string | null;
  actorId?: string | null;
  createdAt: number;
  payload?: any;
}

export class MailboxEvent {
  constructor(
    public readonly seq: string | undefined,
    private props: MailboxEventProps,
  ) {}

  public static create(props: MailboxEventProps): MailboxEvent {
    return new MailboxEvent(props.seq, props);
  }

  public toObject(): MailboxEventProps & { seq?: string } {
    return {
      seq: this.seq,
      ...this.props,
    };
  }

  // ===== Getters =====
  get userId(): string {
    return this.props.userId;
  }

  get threadId(): string {
    return this.props.threadId;
  }

  get eventType(): MailboxEventType {
    return this.props.eventType;
  }

  get messageId(): string | undefined | null {
    return this.props.messageId;
  }

  get actorId(): string | undefined | null {
    return this.props.actorId;
  }

  get createdAt(): number {
    return this.props.createdAt;
  }

  get payload(): any {
    return this.props.payload;
  }
}
