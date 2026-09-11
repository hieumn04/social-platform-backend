export class SendOtpEmailOutput {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly errorCode?: string,
    public readonly retryable?: boolean,
  ) {}
}
