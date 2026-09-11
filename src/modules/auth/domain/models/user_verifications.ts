import { UserVerificationLogProps } from 'src/types/typeModel/userVerificationLog.props';

export class UserVerificationLog {
  constructor(
    public readonly id: string,
    public readonly props: UserVerificationLogProps,
  ) {}

  static createNew(
    id: string,
    props: UserVerificationLogProps,
  ): UserVerificationLog {
    return new UserVerificationLog(id, {
      ...props,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static fromPersistence(
    id: string,
    props: UserVerificationLogProps,
  ): UserVerificationLog {
    return new UserVerificationLog(id, props);
  }

  toPersistence(): { id: string } & UserVerificationLogProps {
    return {
      id: this.id,
      ...this.props,
    };
  }
}
