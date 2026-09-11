export class PermissionAction {
  private constructor(private readonly value: string) {}

  private static readonly VALID_ACTIONS = [
    'create',
    'read',
    'update',
    'delete',
    'manage',
  ] as const;

  public static create(action: string): PermissionAction {
    if (!action || action.trim().length === 0) {
      throw new Error('Permission action cannot be empty');
    }

    const normalizedAction = action.trim().toLowerCase();

    if (!this.VALID_ACTIONS.includes(normalizedAction as any)) {
      throw new Error(
        `Invalid permission action: ${action}. Must be one of: ${this.VALID_ACTIONS.join(', ')}`,
      );
    }

    return new PermissionAction(normalizedAction);
  }

  public static tryCreate(action: string): PermissionAction | null {
    try {
      return PermissionAction.create(action);
    } catch {
      return null;
    }
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: PermissionAction): boolean {
    return this.value === other.value;
  }

  public isDestructive(): boolean {
    return ['delete', 'manage'].includes(this.value);
  }

  public isReadOnly(): boolean {
    return this.value === 'read';
  }
}
