import { RoleProps } from 'src/types/typeModel/roleProp';
import { PermissionVO } from '../value-objects/permission.vo';

export class RoleModel {
  constructor(
    public readonly id: string,
    private props: RoleProps,
  ) {
    this.props.permissions = this.props.permissions || [];
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get permissions(): string[] {
    return this.props.permissions ?? [];
  }

  get isSystemRole(): boolean {
    return this.props.isSystemRole;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDescription(desc: string): void {
    this.props.description = desc;
    this.touchUpdatedAt();
  }

  assignPermission(permission: PermissionVO): void {
    const permStr = permission.toString();
    if (!this.props.permissions!.includes(permStr)) {
      this.props.permissions!.push(permStr);
      this.touchUpdatedAt();
    }
  }

  removePermission(permission: PermissionVO): void {
    const permStr = permission.toString();
    this.props.permissions = this.props.permissions!.filter(
      (p) => p !== permStr,
    );
    this.touchUpdatedAt();
  }

  hasPermission(action: string, resource: string): boolean {
    const permission = PermissionVO.tryCreate(action, resource);
    if (!permission) return false;

    return this.permissions.some((pStr) => {
      const parts = pStr.split(':');
      const [pAction, pResource] = parts;
      return (
        pAction === permission.getAction().getValue() &&
        pResource === permission.getResource().getValue()
      );
    });
  }

  can(action: string, resource: string): boolean {
    return this.hasPermission(action, resource);
  }

  private touchUpdatedAt(): void {
    this.props.updatedAt = new Date();
  }

  public static createNew(
    id: string,
    params: Omit<RoleProps, 'createdAt' | 'updatedAt'>,
  ): RoleModel {
    const now = new Date();
    const props: RoleProps = {
      ...params,
      createdAt: now,
      updatedAt: now,
      permissions: params.permissions || [],
    };

    return new RoleModel(id, props);
  }
}
