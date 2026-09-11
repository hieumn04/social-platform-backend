import { Message } from '@/modules/message/domain/models/messages.model';
import { EntityManager } from 'typeorm';

export interface MessageRepository {
  createIfNotExists(
    message: Message,
    manager?: EntityManager,
  ): Promise<boolean>;
  updateContent(
    messageId: string,
    content: string,
    editedAt: Date,
    manager?: EntityManager,
  ): Promise<boolean>;

  softDelete(
    messageId: string,
    deletedAt: Date,
    manager?: EntityManager,
  ): Promise<void>;

  findById(id: string, manager?: EntityManager): Promise<Message | null>;

  findMessagesByRoom(
    roomId: string,
    options: {
      limit: number;
      before?: {
        createdAt: Date;
        id: string;
      };
    },
    manager?: EntityManager,
  ): Promise<Message[]>;

  delete(id: string, manager?: EntityManager): Promise<void>;
}
