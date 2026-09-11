export class SendChatEventInput {
  constructor(
    public readonly roomId: string,
    public readonly messageId: string,
    public readonly senderId: string,
    public readonly receiverId: string,
    public readonly content: string,
    public readonly createdAt: Date,
  ) {}
}
