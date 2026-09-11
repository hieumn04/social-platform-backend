import { Conversation } from '@/modules/coversation/domain/models/conversation.model';
import { ConversationEntity } from '@/modules/coversation/infrastructure/typeorm/conversation.entity';
import { ConversationProps } from '@/types/typeModel/conversation';

export class ConversationMapper {
  static toDomain(entity: ConversationEntity): Conversation {
    const props: ConversationProps = {
      conversationId: entity.id,
      subtype: entity.subtype,
      createdBy: entity.createdBy ?? null,
      title: entity.title ?? null,
      avatarUrl: entity.avatarUrl ?? null,
      createdAt: entity.createdAt,
      lastMessageId: entity.lastMessageId ?? null,
    };

    return Conversation.restore(props);
  }

  static toEntity(domain: Conversation): ConversationEntity {
    const entity = new ConversationEntity();

    entity.id = domain.conversationId;
    entity.subtype = domain.subtype;
    entity.createdBy = domain.createdBy ?? undefined;
    entity.title = domain.title ?? undefined;
    entity.avatarUrl = domain.avatarUrl ?? undefined;
    entity.createdAt = domain.createdAt;
    entity.lastMessageId = domain.lastMessageId ?? undefined;

    return entity;
  }
}
