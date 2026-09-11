import { RoleProps } from 'src/types/typeModel/roleProp';

import { PermissionVO } from 'src/modules/authorization/domain/value-objects/permission.vo';
import { ChatRoomRole, RoleEnum } from 'src/shared/enums/role.enum';

export const roleData: (RoleProps & { id: string })[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: RoleEnum.SYSTEM_USER,
    slug: 'user',
    description: 'Default role for normal users',
    permissions: [
      PermissionVO.create('read', 'post').toString(),
      PermissionVO.create('read', 'story').toString(),
      PermissionVO.create('read', 'comment').toString(),
    ],
    isSystemRole: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: RoleEnum.SYSTEM_ADMIN,
    slug: 'admin',
    description: 'Administrator with full system access',
    permissions: [
      PermissionVO.create('create', 'post').toString(),
      PermissionVO.create('read', 'post').toString(),
      PermissionVO.create('update', 'post').toString(),
      PermissionVO.create('delete', 'post').toString(),
      PermissionVO.create('manage', 'post').toString(),

      PermissionVO.create('create', 'story').toString(),
      PermissionVO.create('read', 'story').toString(),
      PermissionVO.create('update', 'story').toString(),
      PermissionVO.create('delete', 'story').toString(),
      PermissionVO.create('manage', 'story').toString(),

      PermissionVO.create('create', 'comment').toString(),
      PermissionVO.create('read', 'comment').toString(),
      PermissionVO.create('update', 'comment').toString(),
      PermissionVO.create('delete', 'comment').toString(),
      PermissionVO.create('manage', 'comment').toString(),

      PermissionVO.create('manage', 'user').toString(),
      PermissionVO.create('manage', 'notification').toString(),
    ],
    isSystemRole: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: RoleEnum.SYSTEM_MODERATOR,
    slug: 'moderator',
    description: 'Can manage user content and reports',
    permissions: [
      PermissionVO.create('read', 'post').toString(),
      PermissionVO.create('read', 'story').toString(),
      PermissionVO.create('read', 'comment').toString(),
      PermissionVO.create('delete', 'post').toString(),
      PermissionVO.create('delete', 'story').toString(),
      PermissionVO.create('delete', 'comment').toString(),
    ],
    isSystemRole: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: RoleEnum.SYSTEM_MERCHANT,
    slug: 'merchant',
    description: 'Merchant who manages products and orders',
    permissions: [
      // Nếu bạn muốn resource product/order, cần thêm VALID_RESOURCES tương ứng
      // Ví dụ:
      // PermissionVO.create('create', 'product').toString(),
      // PermissionVO.create('read', 'product').toString(),
      // PermissionVO.create('update', 'product').toString(),
      // PermissionVO.create('delete', 'product').toString(),
    ],
    isSystemRole: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const chatRoomRoleData: (RoleProps & { id: string })[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: ChatRoomRole.CHAT_ADMIN,
    slug: 'chat_admin',
    description: 'Chat room admin with full permissions in a room',
    permissions: ['manage_messages', 'manage_members'], // hoặc PermissionVO
    isSystemRole: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: ChatRoomRole.CHAT_MODERATOR,
    slug: 'chat_moderator',
    description: 'Chat room moderator with limited permissions',
    permissions: ['delete_messages'],
    isSystemRole: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: ChatRoomRole.MEMBER,
    slug: 'member',
    description: 'Normal member in the chat room',
    permissions: ['read_messages', 'send_messages'],
    isSystemRole: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: ChatRoomRole.GUEST,
    slug: 'guest',
    description: 'Guest member with read-only access',
    permissions: ['read_messages'],
    isSystemRole: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
