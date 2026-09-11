import { Role } from 'src/shared/enums/role.enum';

export class RoleName {
  private constructor(private readonly value: Role) {}

  public static create(role: string): RoleName {
    if (!Object.values(Role).includes(role as Role)) {
      throw new Error(`Invalid RoleName: ${role}`);
    }
    return new RoleName(role as Role);
  }

  public getValue(): Role {
    return this.value;
  }

  public equals(other: RoleName): boolean {
    return this.value === other.getValue();
  }
}
