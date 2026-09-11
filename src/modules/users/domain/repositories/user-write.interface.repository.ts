import { User } from '@/modules/users/domain/models/user.model';
import { Email } from '@/modules/value-objects/email';
import { PhoneNumber } from '@/modules/value-objects/phonenumber';
import { UpdatableUserFields } from '@/types/typeModel/userProp';
import { EntityManager } from 'typeorm';

export interface UserWriteRepository {
  findById(id: string): Promise<User | null>;

  findByEmail(email: Email): Promise<User | null>;
  findByPhoneNumber(phoneNumber: PhoneNumber): Promise<User | null>;

  existsByEmail(email: Email): Promise<boolean>;
  existsByUsername(username: string, manager?: EntityManager): Promise<boolean>;

  insert(user: User, manager?: EntityManager): Promise<void>;

  update(
    id: string,
    fields: UpdatableUserFields,
    manager?: EntityManager,
  ): Promise<void>;

  softDelete(id: string, manager?: EntityManager): Promise<void>;
}
