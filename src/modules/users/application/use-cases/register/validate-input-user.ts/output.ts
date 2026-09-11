import { UserRegisterFields } from '@/types/typeModel/userProp';
import { Method } from 'src/shared/enums/statusRegister.enum';

export class ValidateInputUserOutput {
  constructor(
    public readonly isValid: boolean,
    public readonly message?: string,
    public readonly userRegisterResult?: UserRegisterFields,
    public readonly purpose?: Method,
    public readonly ip?: string,
    public readonly deviceId?: string,
  ) {}
}
