import { Method } from 'src/shared/enums/statusRegister.enum';
import { TokenMetaWithoutKey } from 'src/types/token/token.types';
import { AuthUser } from 'src/types/typeModel/userProp';

export class LoginUserOutput {
  constructor(
    public readonly message: string,
    public readonly success: boolean,
    public readonly purpose: Method,
    public readonly userInfo?: AuthUser,
    public readonly meta?: TokenMetaWithoutKey,
  ) {}
}
