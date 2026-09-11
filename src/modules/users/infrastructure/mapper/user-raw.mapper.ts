// infrastructure/mappers/user-raw.mapper.ts

import { User } from '@/modules/users/domain/models/user.model';
import { UserProps } from '@/types/typeModel/userProp';
import { UserRaw } from '@/types/typeModel/user-raw.type';
import { Email } from '@/modules/value-objects/email';
import { PhoneNumber } from '@/modules/value-objects/phonenumber';
import { Password } from '@/modules/value-objects/password';

export class UserRawMapper {
  static toDomain(raw: UserRaw): User {
    const props: UserProps = {
      identityId: raw.identity_id,
      username: raw.username,
      fullName: raw.full_name,

      passwordHash: Password.fromHash(raw.password_hash),

      email: raw.email ? Email.create(raw.email) : undefined,
      phoneNumber: raw.phone_number
        ? PhoneNumber.fromPersistence(raw.phone_number)
        : undefined,

      bio: raw.bio ?? undefined,
      gender: raw.gender,
      avatarUrl: raw.avatar_url ?? undefined,
      profilePicId: raw.profile_pic_id ?? undefined,

      accountCountry: raw.account_country,
      roleId: raw.role_id,

      hasAnonymousProfilePicture: raw.has_anonymous_profile_picture,
      isPrivate: raw.is_private,
      isVerified: raw.is_verified,
      verifiedAt: raw.verified_at,

      isActive: raw.is_active,
      isDeleted: raw.is_deleted,

      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };

    return new User(raw.user_id, props);
  }
}
