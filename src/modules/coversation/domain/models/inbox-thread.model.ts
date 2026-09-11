import {
  InboxFolder,
  ReachabilityStatus,
  SystemFolder,
} from '@/shared/enums/roomStatus.enum';
import { InboxThreadProps } from '@/types/typeModel/inbox-thread';

export class InboxThread {
  private readonly props: InboxThreadProps;

  private constructor(props: InboxThreadProps) {
    this.props = { ...props };
  }

  public static restore(props: InboxThreadProps): InboxThread {
    return new InboxThread(props);
  }

  public static create(params: {
    threadId: string;
    userId: string;
    conversationId: string;
    threadKey: string;
    folder?: InboxFolder;
    systemFolder?: SystemFolder;
  }): InboxThread {
    if (!params.threadId) throw new Error('ThreadId is required');
    if (!params.userId) throw new Error('UserId is required');
    if (!params.conversationId) throw new Error('ConversationId is required');
    if (!params.threadKey) throw new Error('ThreadKey is required');

    const now = new Date();

    return new InboxThread({
      threadId: params.threadId,
      userId: params.userId,
      conversationId: params.conversationId,
      threadKey: params.threadKey,

      folder: params.folder ?? InboxFolder.PRIMARY,
      systemFolder: params.systemFolder ?? SystemFolder.INBOX,
      reachabilityStatus: ReachabilityStatus.REACHABLE,

      lastMessageId: null,
      lastMessageAt: null,
      lastMessageSnippet: null,
      lastMessageSenderId: null,

      lastReadAt: null,
      unreadCount: 0,
      markedAsUnread: false,

      pinned: false,
      muted: false,
      archived: false,

      displayName: null,
      displayAvatarUrl: null,

      createdAt: now,
      updatedAt: now,
    });
  }

  /* ==============================
   * Internal helper
   * ============================== */

  private cloneWith(updatedProps: Partial<InboxThreadProps>): InboxThread {
    return new InboxThread({
      ...this.props,
      ...updatedProps,
      updatedAt: new Date(),
    });
  }

  /* ==============================
   * Domain behaviors
   * ============================== */

  public markAsRead(at: Date = new Date()): InboxThread {
    return this.cloneWith({
      lastReadAt: at,
      unreadCount: 0,
      markedAsUnread: false,
    });
  }

  public markAsUnread(): InboxThread {
    return this.cloneWith({
      markedAsUnread: true,
    });
  }

  public incrementUnread(): InboxThread {
    return this.cloneWith({
      unreadCount: this.props.unreadCount + 1,
    });
  }

  public updateLastMessage(params: {
    messageId: string;
    at: Date;
    snippet?: string;
    senderId?: string;
  }): InboxThread {
    return this.cloneWith({
      lastMessageId: params.messageId,
      lastMessageAt: params.at,
      lastMessageSnippet: params.snippet ?? this.props.lastMessageSnippet,
      lastMessageSenderId: params.senderId ?? this.props.lastMessageSenderId,
    });
  }

  public pin(): InboxThread {
    return this.cloneWith({ pinned: true });
  }

  public unpin(): InboxThread {
    return this.cloneWith({ pinned: false });
  }

  public mute(): InboxThread {
    return this.cloneWith({ muted: true });
  }

  public unmute(): InboxThread {
    return this.cloneWith({ muted: false });
  }

  public archive(): InboxThread {
    return this.cloneWith({
      archived: true,
      systemFolder: SystemFolder.ARCHIVED,
    });
  }

  public unarchive(): InboxThread {
    return this.cloneWith({
      archived: false,
      systemFolder: SystemFolder.INBOX,
    });
  }

  public moveToFolder(folder: InboxFolder): InboxThread {
    return this.cloneWith({ folder });
  }

  public updateDisplay(params: {
    name?: string | null;
    avatarUrl?: string | null;
  }): InboxThread {
    return this.cloneWith({
      displayName:
        params.name !== undefined ? params.name : this.props.displayName,
      displayAvatarUrl:
        params.avatarUrl !== undefined
          ? params.avatarUrl
          : this.props.displayAvatarUrl,
    });
  }

  /* ==============================
   * Getters
   * ============================== */

  public get threadId(): string {
    return this.props.threadId;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get conversationId(): string | undefined {
    return this.props.conversationId;
  }

  public get threadKey(): string {
    return this.props.threadKey;
  }

  public get folder(): InboxFolder {
    return this.props.folder;
  }

  public get systemFolder(): SystemFolder {
    return this.props.systemFolder;
  }

  public get reachabilityStatus(): ReachabilityStatus {
    return this.props.reachabilityStatus;
  }

  public get lastMessageId(): string | null | undefined {
    return this.props.lastMessageId;
  }

  public get lastMessageAt(): Date | null | undefined {
    return this.props.lastMessageAt;
  }

  public get lastMessageSnippet(): string | null | undefined {
    return this.props.lastMessageSnippet;
  }

  public get lastMessageSenderId(): string | null | undefined {
    return this.props.lastMessageSenderId;
  }

  public get lastReadAt(): Date | null | undefined {
    return this.props.lastReadAt;
  }

  public get unreadCount(): number {
    return this.props.unreadCount;
  }

  public get markedAsUnread(): boolean {
    return this.props.markedAsUnread;
  }

  public get pinned(): boolean {
    return this.props.pinned;
  }

  public get muted(): boolean {
    return this.props.muted;
  }

  public get archived(): boolean {
    return this.props.archived;
  }

  public get displayName(): string | null | undefined {
    return this.props.displayName;
  }

  public get displayAvatarUrl(): string | null | undefined {
    return this.props.displayAvatarUrl;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
