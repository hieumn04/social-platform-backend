import { Role } from 'src/modules/authorization/domain/models/role.model';
import { Email } from 'src/modules/value-objects/email';
import { Password } from 'src/modules/value-objects/password';
import { AdminProps } from 'src/types/typeModel/admin';


export class Admin {
  private constructor(
    private readonly _id: string,
    private props: AdminProps,
  ) {}


  get id(): string {
    return this._id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get emailValue(): string {
    return this.props.email.getValue();
  }

  get passwordHash(): Password {
    return this.props.passwordHash;
  }

  get role(): Role {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }


  deactivate(): void {
    if (!this.props.isActive) return;
    this.props.isActive = false;
    this.touchUpdatedAt();
  }


  activate(): void {
    if (this.props.isActive) return;
    this.props.isActive = true;
    this.touchUpdatedAt();
  }


  changeRole(newRole: Role, performedBy: Admin): void {
    if (!performedBy.role.canManage(this.role)) {
      throw new DomainError('Bạn không có quyền thay đổi vai trò này');
    }

    if (newRole !== this.props.role) {
      this.props.role = newRole;
      this.touchUpdatedAt();
    }
  }


  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DomainError('Tên không hợp lệ');
    }
    if (newName !== this.props.name) {
      this.props.name = newName;
      this.touchUpdatedAt();
    }
  }


  changePassword(newPasswordHash: Password): void {
    this.props.passwordHash = newPasswordHash;
    this.touchUpdatedAt();
  }



  private touchUpdatedAt(): void {
    this.props.updatedAt = new Date();
  }

  toObject(): { id: string } & AdminProps {
    return { id: this._id, ...this.props };
  }

  static create(
    id: string,
    params: Omit<AdminProps, 'createdAt' | 'updatedAt' | 'isActive'>,
  ): Admin {
    const now = new Date();

    const props: AdminProps = {
      ...params,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    return new Admin(id, props);
  }

  static restore(id: string, props: AdminProps): Admin {

    return new Admin(id, props);
  }
}
