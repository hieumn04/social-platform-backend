import { Email } from 'src/modules/value-objects/email';
import { Password } from 'src/modules/value-objects/password';
import { PhoneNumber } from 'src/modules/value-objects/phonenumber';
import { Gender } from 'src/shared/enums/gender.enum';

export interface UserProps {
  identityId: string;
  username: string;
  passwordHash: Password;
  fullName: string;
  email?: Email;
  accountCountry: string;
  phoneNumber?: PhoneNumber;
  bio?: string;
  roleId?: string;
  gender?: Gender;
  avatarUrl?: string;
  profilePicId?: string;
  hasAnonymousProfilePicture: boolean;
  createdAt: Date;
  updatedAt: Date;
  isPrivate: boolean;
  isVerified: boolean;
  verifiedAt: Date | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface UserBasicReadModel {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  hasAnonymousProfilePicture: boolean;
  isPrivate: boolean;
  isVerified: boolean;
}

export interface UserSearchReadModel extends UserBasicReadModel {}

export interface UserProfileReadModel extends UserBasicReadModel {
  bio?: string;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
}

export type AuthUser = {
  userId: string;
  roleId?: string;
  identifier: string;
};

export interface UpdatableUserFields {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  gender?: Gender;
}

export interface CreateUserCommand {
  identityId: string;
  username: string;
  fullName: string;
  passwordHash: Password;

  email?: Email;
  phoneNumber?: PhoneNumber;
  accountCountry: string;
  gender?: Gender;
}

export const USER_REGISTER_FIELDS = [
  'email',
  'phoneNumber',
  'username',
  'passwordHash',
  'fullName',
  'gender',
] as const;

export interface UserRegisterInput {
  username: string;
  fullName: string;
  password: string;

  email?: string;
  phoneNumber?: string;
  gender: Gender;
}

export type UserRegisterFields = Pick<
  CreateUserCommand,
  (typeof USER_REGISTER_FIELDS)[number]
>;

export type Account = {
  email?: Email;
  phoneNumber?: PhoneNumber;
  nickname?: string;
};

export interface IdentifierResult {
  email?: Email;
  phoneNumber?: PhoneNumber;
  identifierType: 'email' | 'phone' | null;
}
