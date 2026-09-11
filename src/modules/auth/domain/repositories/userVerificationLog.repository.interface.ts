import { EntityManager } from 'typeorm';
import { UserVerificationLog } from '../models/user_verifications';
import { Method } from 'src/shared/enums/statusRegister.enum';

export interface UserVerificationLogRepository {
  findById(id: string): Promise<UserVerificationLog | null>;

  findRecentByUser(
    userId: string,
    limit?: number,
  ): Promise<UserVerificationLog[]>;

  findLatestByUserAndPurpose(
    userId: string,
    purpose: Method,
  ): Promise<UserVerificationLog | null>;

  insert(log: UserVerificationLog, manager?: EntityManager): Promise<void>;

  insertMany(
    logs: UserVerificationLog[],
    manager?: EntityManager,
  ): Promise<void>;
}
