import {
  StatusRegister,
  Method,
  Status,
} from 'src/shared/enums/statusRegister.enum';
import { UserAgentResult } from '../express';

export interface UserVerificationLogProps {
  userId: string;
  ipAddress?: string;
  deviceId?: string;
  userAgent?: UserAgentResult;
  type: StatusRegister;
  purpose: Method;
  status: Status;
  target: string;
  tokenSentAt?: Date | null;
  createdAt: Date;
  verifiedAt?: Date | null;
  expiresAt?: Date | null;
  attemptCount: number;
}
