import { UpdatableUserFields } from '@/types/typeModel/userProp';

export const USER_UPDATE_COLUMN_MAP: Record<keyof UpdatableUserFields, string> =
  {
    fullName: 'full_name',
    bio: 'bio',
    avatarUrl: 'avatar_url',
    isPrivate: 'is_private',
    gender: 'gender',
  };
