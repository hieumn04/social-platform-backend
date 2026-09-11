export class SendChatEventOutput {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly messageId: string,
  ) {}
}
