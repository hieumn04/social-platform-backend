import {
  ConversationRole,
  ParticipantStatus,
} from '@/shared/enums/roomStatus.enum';
import { ConversationParticipantProps } from '@/types/typeModel/conversation-participant';

export class ConversationParticipant {
  private readonly props: ConversationParticipantProps;

  private constructor(props: ConversationParticipantProps) {
    this.props = { ...props };
  }

  /* ==============================
   * Factory methods
   * ============================== */

  /** Restore from persistence */
  public static restore(
    props: ConversationParticipantProps,
  ): ConversationParticipant {
    return new ConversationParticipant(props);
  }

  /** Create new participant */
  public static create(params: {
    conversationId: string;
    userId: string;
    role?: ConversationRole;
  }): ConversationParticipant {
    if (!params.conversationId) throw new Error('ConversationId is required');
    if (!params.userId) throw new Error('UserId is required');

    const now = new Date();

    return new ConversationParticipant({
      conversationId: params.conversationId,
      userId: params.userId,
      role: params.role ?? ConversationRole.MEMBER,
      status: ParticipantStatus.ACTIVE,

      lastReadAt: null,
      manuallyMarkedUnread: false,
      isHidden: false,
      lastActivityAt: now,

      muted: false,
      archived: false,
      pinned: false,

      nickname: null,

      joinedAt: now,
      leftAt: null,
      updatedAt: now,
    });
  }

  /* ==============================
   * Internal helper
   * ============================== */

  private cloneWith(
    updatedProps: Partial<ConversationParticipantProps>,
  ): ConversationParticipant {
    return new ConversationParticipant({
      ...this.props,
      ...updatedProps,
      updatedAt: new Date(),
    });
  }

  /* ==============================
   * Domain behaviors
   * ============================== */

  public isActive(): boolean {
    return this.props.status === ParticipantStatus.ACTIVE;
  }

  public isPinned(): boolean {
    return this.props.pinned;
  }

  public markAsRead(at: Date = new Date()): ConversationParticipant {
    return this.cloneWith({
      lastReadAt: at,
      manuallyMarkedUnread: false,
    });
  }

  public markAsUnread(): ConversationParticipant {
    return this.cloneWith({
      manuallyMarkedUnread: true,
    });
  }

  public updateLastActivity(at: Date): ConversationParticipant {
    return this.cloneWith({
      lastActivityAt: at,
    });
  }

  public pin(): ConversationParticipant {
    return this.cloneWith({ pinned: true });
  }

  public unpin(): ConversationParticipant {
    return this.cloneWith({ pinned: false });
  }

  public mute(): ConversationParticipant {
    return this.cloneWith({ muted: true });
  }

  public unmute(): ConversationParticipant {
    return this.cloneWith({ muted: false });
  }

  public archive(): ConversationParticipant {
    return this.cloneWith({ archived: true });
  }

  public unarchive(): ConversationParticipant {
    return this.cloneWith({ archived: false });
  }

  public hide(): ConversationParticipant {
    return this.cloneWith({ isHidden: true });
  }

  public show(): ConversationParticipant {
    return this.cloneWith({ isHidden: false });
  }

  public leave(): ConversationParticipant {
    return this.cloneWith({
      status: ParticipantStatus.LEFT,
      leftAt: new Date(),
    });
  }

  public changeNickname(nickname: string | null): ConversationParticipant {
    return this.cloneWith({ nickname });
  }

  /* ==============================
   * Getters
   * ============================== */

  public get conversationId(): string {
    return this.props.conversationId;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get role(): ConversationRole {
    return this.props.role;
  }

  public get status(): ParticipantStatus {
    return this.props.status;
  }

  public get lastReadAt(): Date | null | undefined {
    return this.props.lastReadAt;
  }

  public get manuallyMarkedUnread(): boolean {
    return this.props.manuallyMarkedUnread;
  }

  public get isHidden(): boolean {
    return this.props.isHidden;
  }

  public get lastActivityAt(): Date | null | undefined {
    return this.props.lastActivityAt;
  }

  public get muted(): boolean {
    return this.props.muted;
  }

  public get archived(): boolean {
    return this.props.archived;
  }

  public get pinned(): boolean {
    return this.props.pinned;
  }

  public get nickname(): string | null | undefined {
    return this.props.nickname;
  }

  public get joinedAt(): Date {
    return this.props.joinedAt;
  }

  public get leftAt(): Date | null | undefined {
    return this.props.leftAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
