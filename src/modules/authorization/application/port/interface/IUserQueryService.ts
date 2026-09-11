import { User } from '../../../domain/models/role.model';

export interface IUserQueryService {
  getUserById(userId: string): Promise<User | null>;
}
