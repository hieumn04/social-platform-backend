import { UserFollowAction } from '@/shared/enums/user-follow-status.enum';
import { UserFollowActionRecordProps } from '@/types/typeModel/follows';

export class UserFollowEvent {
  constructor(
    public readonly actorId: string,
    public readonly targetId: string,
    private readonly props: UserFollowActionRecordProps,
  ) {}

  toObject(): {
    actorId: string;
    targetId: string;
  } & UserFollowActionRecordProps {
    return {
      actorId: this.actorId,
      targetId: this.targetId,
      ...this.props,
    };
  }

  get action(): UserFollowAction {
    return this.props.action;
  }

  get context(): number {
    return this.props.context;
  }

  get metadata() {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(props: {
    actorId: string;
    targetId: string;
    action: UserFollowAction;
    context: number;
    metadata?: Record<string, any>;
  }): UserFollowEvent {
    return new UserFollowEvent(props.actorId, props.targetId, {
      action: props.action,
      context: props.context,
      metadata: props.metadata,
      createdAt: new Date(),
    });
  }
}
