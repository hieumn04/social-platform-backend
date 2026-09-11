import { Method } from 'src/shared/enums/statusRegister.enum';

export class VerifyOtpOutput {
  constructor(
    public readonly message: string,
    public readonly success: boolean,
    public readonly purpose?: Method,
    public readonly userId?: string,
  ) {}
}
