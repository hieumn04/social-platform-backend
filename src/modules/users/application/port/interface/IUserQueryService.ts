import { User } from '../../../domain/models/user.model';

export interface IUserQueryService {
  getUserById(userId: string): Promise<User | null>;
  existUserById(userId: string): Promise<boolean>;
}
