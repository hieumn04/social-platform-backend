import { ConversationSubtype } from '@/shared/enums/roomStatus.enum';
import { ConversationProps } from '@/types/typeModel/conversation';

export class Conversation {
  private readonly props: ConversationProps;

  private constructor(props: ConversationProps) {
    this.props = { ...props };
  }

  /* ==============================
   * Factory methods
   * ============================== */

  /** Restore from persistence */
  public static restore(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  /** Create private conversation (1-1) */
  public static createPrivate(params: {
    conversationId: string;
    createdBy: string;
  }): Conversation {
    if (!params.conversationId) throw new Error('ConversationId is required');
    if (!params.createdBy) throw new Error('CreatedBy is required');

    return new Conversation({
      conversationId: params.conversationId,
      subtype: ConversationSubtype.ONE_TO_ONE,
      createdBy: params.createdBy,
      title: null,
      avatarUrl: null,
      createdAt: new Date(),
      lastMessageId: null,
    });
  }

  /** Create group conversation */
  public static createGroup(params: {
    conversationId: string;
    createdBy: string;
    title?: string;
    avatarUrl?: string;
  }): Conversation {
    if (!params.conversationId) throw new Error('ConversationId is required');
    if (!params.createdBy) throw new Error('CreatedBy is required');

    return new Conversation({
      conversationId: params.conversationId,
      subtype: ConversationSubtype.GROUP,
      createdBy: params.createdBy,
      title: params.title ?? null,
      avatarUrl: params.avatarUrl ?? null,
      createdAt: new Date(),
      lastMessageId: null,
    });
  }

  /* ==============================
   * Internal helper
   * ============================== */

  private cloneWith(updatedProps: Partial<ConversationProps>): Conversation {
    return new Conversation({
      ...this.props,
      ...updatedProps,
    });
  }

  /* ==============================
   * Domain behaviors
   * ============================== */

  public isPrivate(): boolean {
    return this.props.subtype === ConversationSubtype.ONE_TO_ONE;
  }

  public isGroup(): boolean {
    return this.props.subtype === ConversationSubtype.GROUP;
  }

  public changeTitle(title: string): Conversation {
    if (this.isPrivate()) {
      throw new Error('Private conversation cannot change title');
    }
    return this.cloneWith({ title });
  }

  public changeAvatar(avatarUrl: string): Conversation {
    if (this.isPrivate()) {
      throw new Error('Private conversation cannot change avatar');
    }
    return this.cloneWith({ avatarUrl });
  }

  public updateLastMessage(messageId: string): Conversation {
    return this.cloneWith({ lastMessageId: messageId });
  }

  /* ==============================
   * Getters
   * ============================== */

  public get conversationId(): string {
    return this.props.conversationId;
  }

  public get subtype(): ConversationSubtype {
    return this.props.subtype;
  }

  public get createdBy(): string | null | undefined {
    return this.props.createdBy;
  }

  public get title(): string | null | undefined {
    return this.props.title;
  }

  public get avatarUrl(): string | null | undefined {
    return this.props.avatarUrl;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get lastMessageId(): string | null | undefined {
    return this.props.lastMessageId;
  }
}
