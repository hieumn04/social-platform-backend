import { UserIdentityProps } from '@/types/typeModel/user-identity.props';

export class UserIdentity {
  constructor(
    private readonly identityId: string,
    private props: UserIdentityProps,
  ) {}

  static restore(identityId: string, props: UserIdentityProps): UserIdentity {
    if (!identityId) {
      throw new Error('IdentityId is required');
    }

    if (!props.fbidV2) {
      throw new Error('fbidV2 is required');
    }

    return new UserIdentity(identityId, props);
  }

  static createNew(params: {
    identityId: string;
    fbidV2: string;
  }): UserIdentity {
    if (!params.identityId) {
      throw new Error('IdentityId is required');
    }

    if (!params.fbidV2) {
      throw new Error('fbidV2 is required');
    }

    return new UserIdentity(params.identityId, {
      fbidV2: params.fbidV2,
      status: 'ACTIVE',
      createdAt: new Date(),
    });
  }

  suspend(): void {
    if (this.props.status === 'DELETED') {
      throw new Error('Cannot suspend deleted identity');
    }

    this.props.status = 'SUSPENDED';
  }

  activate(): void {
    if (this.props.status === 'DELETED') {
      throw new Error('Cannot activate deleted identity');
    }

    this.props.status = 'ACTIVE';
  }

  delete(): void {
    this.props.status = 'DELETED';
  }

  get id(): string {
    return this.identityId;
  }

  get fbidV2(): string {
    return this.props.fbidV2;
  }

  get status(): 'ACTIVE' | 'SUSPENDED' | 'DELETED' {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toSnapshot(): { identityId: string } & UserIdentityProps {
    return {
      identityId: this.identityId,
      ...this.props,
    };
  }
}
