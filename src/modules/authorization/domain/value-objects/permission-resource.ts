export class PermissionResource {
  private constructor(private readonly value: string) {}

  private static readonly VALID_RESOURCES = [
    'post',
    'story',
    'comment',
    'user',
    'message',
    'notification',
  ] as const;

  public static create(resource: string): PermissionResource {
    if (!resource || resource.trim().length === 0) {
      throw new Error('Permission resource cannot be empty');
    }

    const normalizedResource = resource.trim().toLowerCase();
    if (!this.VALID_RESOURCES.includes(normalizedResource as any)) {
      throw new Error(
        `Invalid permission resource: ${resource}. Must be one of: ${this.VALID_RESOURCES.join(', ')}`,
      );
    }

    return new PermissionResource(normalizedResource);
  }

  public static tryCreate(resource: string): PermissionResource | null {
    try {
      return PermissionResource.create(resource);
    } catch {
      return null;
    }
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: PermissionResource): boolean {
    return this.value === other.value;
  }

  public isUserContent(): boolean {
    return ['post', 'story', 'comment'].includes(this.value);
  }

  public isSystemResource(): boolean {
    return ['user', 'notification'].includes(this.value);
  }
}
