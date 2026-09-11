import { RequestContextInfo } from 'src/types/express';

export class LoginUserInput {
  constructor(
    public readonly accountname: string,
    public readonly password: string,
    public readonly requestContext: RequestContextInfo,
  ) {}
}
