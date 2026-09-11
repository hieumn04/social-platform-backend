export class SendOtpOutput {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly sessionToken?: string,
    public readonly maskedEmail?: string,
    public readonly expiresAt?: string,
    public readonly expiresIn?: number,
    public readonly resendAfter?: number,
    public readonly errorCode?: string,
    public readonly retryable?: boolean,
  ) {}
}
