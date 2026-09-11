export class RegisterOutput {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly isVerified: boolean,
    public readonly accessToken?: string,
    public readonly refreshToken?: string,
    public readonly isNewUser: boolean = true,
    public readonly needVerifyEmail: boolean = true,
  ) {}
}
