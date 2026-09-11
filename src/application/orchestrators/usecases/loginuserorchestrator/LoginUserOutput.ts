import { TokenPairResult } from 'src/types/token/token.types';

export class LoginUserOutput {
  constructor(
    public readonly message: string,
    public readonly success: boolean,
    public readonly tokens?: TokenPairResult,
  ) {}
}
