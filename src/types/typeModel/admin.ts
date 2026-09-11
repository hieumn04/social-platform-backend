import { Email } from 'src/modules/value-objects/email';
import { Password } from 'src/modules/value-objects/password';

export interface AdminProps {
  name: string;
  email: Email;
  passwordHash: Password;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
