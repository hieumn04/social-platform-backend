import { EntityManager } from 'typeorm';
import { MessagingPlatform } from '@/shared/enums/message.enum';

export interface MessagingIdentityRepository {
  insert(
    params: {
      userId: string;
      interopMessagingUserFbid: string;
      platform: MessagingPlatform;
    },
    manager?: EntityManager,
  ): Promise<string>;

  getInteropIdByUserId(
    userId: string,
    platform: MessagingPlatform,
    manager?: EntityManager,
  ): Promise<string | null>;
}
