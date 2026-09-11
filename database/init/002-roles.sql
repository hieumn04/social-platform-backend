INSERT INTO `roles`
  (`role_id`, `Name`, `Slug`, `Description`, `PermissionIds`, `IsSystemRole`)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'SYSTEM_USER', 'user', 'Default role for normal users', 'read:post,read:story,read:comment', 1),
  ('22222222-2222-2222-2222-222222222222', 'SYSTEM_ADMIN', 'admin', 'Administrator with full system access', 'manage:post,manage:user,manage:notification', 1),
  ('33333333-3333-3333-3333-333333333333', 'SYSTEM_MODERATOR', 'moderator', 'Content moderator', 'read:post,delete:post,delete:story,delete:comment', 1),
  ('44444444-4444-4444-4444-444444444444', 'SYSTEM_MERCHANT', 'merchant', 'Merchant account', '', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CHAT_ADMIN', 'chat_admin', 'Chat room administrator', 'manage_messages,manage_members', 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CHAT_MODERATOR', 'chat_moderator', 'Chat room moderator', 'delete_messages', 0),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'MEMBER', 'member', 'Normal chat member', 'read_messages,send_messages', 0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'GUEST', 'guest', 'Read-only chat member', 'read_messages', 0)
ON DUPLICATE KEY UPDATE `UpdatedAt` = `UpdatedAt`;
