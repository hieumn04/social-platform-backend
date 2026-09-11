import { MessagingPlatform } from '@/shared/enums/message.enum';
import { MessagingIdentityProps } from '@/types/typeModel/message';

export class MessagingActor {
  constructor(
    public readonly messagingIdentityId: string,
    private props: MessagingIdentityProps,
  ) {}

  static restore(id: string, props: MessagingIdentityProps): MessagingActor {
    if (!id) throw new Error('MessagingIdentityId is required');

    return new MessagingActor(id, props);
  }

  static createNew(
    id: string,
    params: {
      userId: string;
      platform?: MessagingPlatform;
    },
  ): MessagingActor {
    if (!id) throw new Error('MessagingIdentityId is required');
    if (!params.userId) throw new Error('UserId is required');

    return new MessagingActor(id, {
      userId: params.userId,
      platform: params.platform ?? MessagingPlatform.IG,
      createdAt: new Date(),
    });
  }

  get id(): string {
    return this.messagingIdentityId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get platform(): MessagingPlatform {
    return this.props.platform;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toSnapshot(): { messagingIdentityId: string } & MessagingIdentityProps {
    return {
      messagingIdentityId: this.messagingIdentityId,
      ...this.props,
    };
  }
}
