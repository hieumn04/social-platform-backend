import { Method } from 'src/shared/enums/statusRegister.enum';
import { RefreshTokenProps } from 'src/types/token/refreshToken.props';
import { TokenMetaWithoutKey } from 'src/types/token/token.types';

export class InsertRefreshTokenInput {
  constructor(
    public readonly refreshTokenProps: Omit<
      RefreshTokenProps,
      'refreshToken' | 'jti'
    >,
    public readonly purpose: Method,
    public readonly meta: TokenMetaWithoutKey,
    public readonly refreshToken: string,
    public readonly jti: string,
  ) {}
}
