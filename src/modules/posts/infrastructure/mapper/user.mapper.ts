import { UserProps } from 'src/types/typeModel/userProp';
import { User } from '../../domain/models/follows.model';
import { UserEntity } from '../typeorm/posts.entity';

import { Password } from 'src/modules/value-objects/password';
import { Email } from 'src/modules/value-objects/email';
import { PhoneNumber } from 'src/modules/value-objects/phonenumber';

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    const props: UserProps = {
      passwordHash: Password.fromHash(entity.passwordHash ?? ''),
      name: entity.name,
      fullname: entity.fullname,
      email: Email.create(entity.email ?? ''),
      address: entity.address,
      phoneNumber: entity.phoneNumber
        ? PhoneNumber.fromPersistence(entity.phoneNumber)
        : undefined,
      roleId: entity.roleId,
      gender: entity.gender,
      avatarUrl: entity.avatarUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      isVerified: entity.isVerified,
      lastLoginAt: entity.lastLoginAt,
      verifiedAt: entity.verifiedAt,
      isActive: entity.isActive,
      isDeleted: entity.isDeleted,
    };
    return new User(entity.id, props);
  }

  static toEntity(domain: User): UserEntity {
    const entity = new UserEntity();

    entity.id = domain.userId;
    entity.name = domain.name;
    entity.fullname = domain.fullname;
    entity.passwordHash = domain.passwordHash
      ? domain.passwordHash.getValue()
      : null;
    entity.email = domain.emailValue;
    entity.address = domain.address;
    entity.phoneNumber = domain.phoneNumber
      ? domain.phoneNumber.getValue()
      : null;
    entity.roleId = domain.role ?? '';
    entity.gender = domain.gender;
    entity.avatarUrl = domain.avatarUrl;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.isVerified = domain.isVerified;
    entity.lastLoginAt = domain.lastLoginAt;
    entity.verifiedAt = domain.verifiedAt;
    entity.isActive = domain.isActive;
    entity.isDeleted = domain.isDeleted;

    return entity;
  }
}
