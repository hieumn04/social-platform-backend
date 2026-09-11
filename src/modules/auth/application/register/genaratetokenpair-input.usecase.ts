import { Method } from 'src/shared/enums/statusRegister.enum';
import { TokenMetaWithoutKey } from 'src/types/token/token.types';
import { AuthUser } from 'src/types/typeModel/userProp';

export class GenarateTokenPairUserInput {
  constructor(
    public readonly userInfo: AuthUser,
    public readonly purpose: Method,
    public readonly meta?: TokenMetaWithoutKey,
  ) {}
}
