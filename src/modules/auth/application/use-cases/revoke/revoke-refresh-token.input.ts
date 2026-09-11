export class RevokeTokenInput {
  constructor(
    public readonly accessTokenRaw: string,
    public readonly refreshTokenRaw: string,
    public readonly sessionId: string,
  ) {}
}
