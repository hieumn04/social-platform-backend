import { Method } from 'src/shared/enums/statusRegister.enum';
import { UserRegisterInput } from 'src/types/typeModel/userProp';

export class ValidateInputUser {
  constructor(
    public readonly userRegister: UserRegisterInput,
    public readonly purpose: Method,
    public readonly ip: string,
    public readonly deviceId: string,
  ) {}
}
