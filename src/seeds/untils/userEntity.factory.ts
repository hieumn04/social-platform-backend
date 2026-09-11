// import { UserEntity } from 'src/modules/users/infrastructure/typeorm/user.entity';
// import { UserProps } from 'src/types/typeModel/userProp';

// export function userEntityFactory(
//   data: UserProps & { id: string },
// ): UserEntity {
//   const userEntity = new UserEntity();

//   userEntity.id = data.id;
//   userEntity.name = data.name;
//   userEntity.fullname = data.fullname;
//   userEntity.passwordHash = data.passwordHash;

//   userEntity.email = data.email.getValue();

//   userEntity.address = data.address;
//   userEntity.phoneNumber = data.phoneNumber;
//   userEntity.role = data.role;
//   userEntity.gender = data.gender;

//   userEntity.createdAt = data.createdAt;
//   userEntity.updatedAt = data.updatedAt;
//   userEntity.isVerified = data.isVerified;
//   userEntity.verifiedAt = data.verifiedAt ?? null;
//   userEntity.lastLoginAt = data.lastLoginAt ?? null;

//   userEntity.isActive = data.isActive;
//   userEntity.isDeleted = data.isDeleted;

//   return userEntity;
// }
