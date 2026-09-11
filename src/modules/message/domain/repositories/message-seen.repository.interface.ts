import { MessageSeen } from '@/modules/message/domain/models/message-seen.model';
import { EntityManager } from 'typeorm';

export interface MessageSeenRepository {
  createIfNotExists(
    messageSeen: MessageSeen,
    manager?: EntityManager,
  ): Promise<boolean>;

  bulkCreateIfNotExists(
    items: MessageSeen[],
    manager?: EntityManager,
  ): Promise<number>;

  exists(
    messageId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  findUserIdsByMessageId(
    messageId: string,
    manager?: EntityManager,
  ): Promise<string[]>;

  findSeenMessageIdsByUserInRoom(
    roomId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<string[]>;
}
