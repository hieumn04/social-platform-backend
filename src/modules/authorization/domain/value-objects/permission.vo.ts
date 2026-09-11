import { PermissionAction } from './permission-action';
import { PermissionResource } from './permission-resource';

export class PermissionVO {
  private constructor(
    private readonly action: PermissionAction,
    private readonly resource: PermissionResource,
  ) {}

  public static create(action: string, resource: string): PermissionVO {
    const validAction = PermissionAction.create(action);
    const validResource = PermissionResource.create(resource);
    return new PermissionVO(validAction, validResource);
  }

  public static tryCreate(
    action: string,
    resource: string,
  ): PermissionVO | null {
    const validAction = PermissionAction.tryCreate(action);
    const validResource = PermissionResource.tryCreate(resource);

    if (!validAction || !validResource) {
      return null;
    }

    return new PermissionVO(validAction, validResource);
  }

  public toString(): string {
    return `${this.action.getValue()}:${this.resource.getValue()}`;
  }

  public getAction(): PermissionAction {
    return this.action;
  }

  public getResource(): PermissionResource {
    return this.resource;
  }

  public equals(other: PermissionVO): boolean {
    return (
      this.action.equals(other.action) && this.resource.equals(other.resource)
    );
  }

  public allowsCreation(): boolean {
    return this.action.getValue() === 'create';
  }

  public allowsDeletion(): boolean {
    return this.action.getValue() === 'delete';
  }

  public isForUserContent(): boolean {
    return this.resource.isUserContent();
  }
}
