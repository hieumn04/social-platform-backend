import { UserProfileQueryRow } from '@/types/typeModel/user-raw.type';
import {
  UserProfileReadModel,
  UserSearchReadModel,
} from '@/types/typeModel/userProp';

export interface UserReadRepository {
  findProfileById(id: string): Promise<UserProfileQueryRow | null>;

  findProfilesByIds(ids: readonly string[]): Promise<UserProfileQueryRow[]>;

  searchByUsername(
    keyword: string,
    limit?: number,
  ): Promise<UserSearchReadModel[]>;
}
