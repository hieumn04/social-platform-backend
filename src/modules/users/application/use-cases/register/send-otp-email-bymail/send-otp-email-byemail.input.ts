export class SendOtpEmailInput {
  constructor(
    public readonly to: string,
    public readonly otp: string,
    public readonly subject: string,
    public readonly text?: string,
    public readonly html?: string,
  ) {}
}
