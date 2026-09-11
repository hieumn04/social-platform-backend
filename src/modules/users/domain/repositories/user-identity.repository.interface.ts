import { EntityManager } from 'typeorm';
import { UserIdentity } from '@/modules/users/domain/models/user-identity.model';

export interface UserIdentityRepository {
  insert(identity: UserIdentity, manager?: EntityManager): Promise<void>;

  findFbidV2ByIdentityId(identityId: string): Promise<string | null>;

  existsByFbidV2(fbidV2: string, manager?: EntityManager): Promise<boolean>;
}
