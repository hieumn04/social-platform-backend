import { User } from '../models/role.model';
import { Email } from '../value-objects/rolename';

export interface UserRepository {
  // === Query ===
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
  existsByEmail(email: Email): Promise<boolean>;
  // findByHashedID(hashedId: string): Promise<User | null>;

  // === Command ===
  save(user: User): Promise<void>;
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;

  // === State Updates (Admin / System actions) ===
  reactivate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;

  findLatestByUserId(): Promise<User | null>;
}
