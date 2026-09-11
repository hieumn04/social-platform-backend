// import { UserProps } from 'src/types/typeModel/userProp';
// import { Password } from 'src/modules/value-objects/password';
// import { Email } from 'src/modules/value-objects/email';
// import { PhoneNumber } from 'src/modules/value-objects/phonenumber';
// import { User } from '@/modules/users/domain/models/user.model';
// import { UserEntity } from '@/modules/users/infrastructure/typeorm/user.entity';

// export class UserMapper {
//   static toDomain(entity: UserEntity): User {
//     const props: UserProps = {
//       passwordHash: Password.fromHash(entity.passwordHash ?? ''),
//       name: entity.username,
//       fullname: entity.fullName,
//       email: Email.create(entity.email ?? ''),
//       accountCountry: entity.accountCountry,
//       phoneNumber: entity.phoneNumber
//         ? PhoneNumber.fromPersistence(entity.phoneNumber)
//         : undefined,
//       roleId: entity.roleId,
//       gender: entity.gender,
//       hasAnonymousProfilePicture: entity.hasAnonymousProfilePicture,
//       avatarUrl: entity.avatarUrl,
//       createdAt: entity.createdAt,
//       updatedAt: entity.updatedAt,
//       isVerified: entity.isVerified,
//       lastLoginAt: entity.lastLoginAt,
//       verifiedAt: entity.verifiedAt,
//       isActive: entity.isActive,
//       isDeleted: entity.isDeleted,
//       isPrivate: entity.isPrivate,
//     };
//     return new User(entity.id, props);
//   }

//   static toEntity(domain: User): UserEntity {
//     const entity = new UserEntity();

//     entity.id = domain.userId;
//     entity.username = domain.name;
//     entity.fullName = domain.fullname;
//     entity.passwordHash = domain.passwordHash
//       ? domain.passwordHash.getValue()
//       : null;
//     entity.email = domain.emailValue;
//     entity.accountCountry = domain.accountCountry;
//     entity.phoneNumber = domain.phoneNumber
//       ? domain.phoneNumber.getValue()
//       : null;
//     entity.roleId = domain.roleId ?? '';
//     entity.gender = domain.gender;
//     entity.hasAnonymousProfilePicture = domain.hasAnonymousProfilePicture;
//     entity.avatarUrl = domain.avatarUrl;
//     entity.createdAt = domain.createdAt;
//     entity.updatedAt = domain.updatedAt;
//     entity.isVerified = domain.isVerified;
//     entity.lastLoginAt = domain.lastLoginAt;
//     entity.verifiedAt = domain.verifiedAt;
//     entity.isActive = domain.isActive;
//     entity.isDeleted = domain.isDeleted;

//     return entity;
//   }
// }
