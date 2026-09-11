import { RequestContextInfo } from 'src/types/express';

export class RegisterUserInput {
  constructor(
    public readonly otpEnter: string,
    public readonly jti: string,
    public readonly requestContext: RequestContextInfo,
  ) {}
}
