export class RefreshTokenOutput {
  constructor(
    public readonly message: string,
    public readonly success: boolean,
    public readonly accessToken?: string,
    public readonly expiresIn?: number,
    public readonly refreshJti?: string,
  ) {}
}
