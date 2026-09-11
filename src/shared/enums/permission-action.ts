export enum PermissionAction {
  READ = 'READ',
  WRITE = 'WRITE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CREATE = 'CREATE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EXECUTE = 'EXECUTE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}
export function parsePermissionAction(
  action?: string,
): PermissionAction | undefined {
  if (!action) return undefined;
  const upper = action.toUpperCase();
  return (Object.values(PermissionAction) as string[]).includes(upper)
    ? (upper as PermissionAction)
    : undefined;
}
