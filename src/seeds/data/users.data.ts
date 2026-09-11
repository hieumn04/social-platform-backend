// src/seeds/user-data.ts (ví dụ đường dẫn file)

import { Email } from 'src/modules/users/domain/value-objects/email';
import { Gender } from 'src/shared/enums/gender.enum';
import { Role } from 'src/shared/enums/role.enum';
import { UserProps } from 'src/types/typeModel/userProp';

export const userData: (UserProps & { id: string })[] = [
  {
    id: '1c5fa07e-9b7f-4fa2-aef3-1c1ef10c0001',

    name: 'hieu',
    fullname: 'zhao lusi',
    email: Email.create('hieu@example.com'),
    passwordHash: '$2b$10$12345678...',
    address: '123 HCM',
    phoneNumber: '0909123456',
    role: Role.USER,
    gender: Gender.MALE,
    avatarUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    isVerified: false,
    verifiedAt: null,
    lastLoginAt: null,
    isActive: true,
    isDeleted: false,
  },
];
