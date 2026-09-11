export class VerifyOtpInput {
  constructor(
    public readonly otpEnter: string,
    public readonly sessionToken: string,
    public readonly deviceId: string,
  ) {}
}
