import { UserFollowEvent } from '@/modules/follow/domain/models/user-follow-event';
import { UserFollowEventEntity } from '@/modules/follow/infrastructure/typeorm/user-follow-event.entity';

export class UserFollowEventMapper {
  static toEntity(domain: UserFollowEvent): UserFollowEventEntity {
    const entity = new UserFollowEventEntity();

    entity.actorId = domain.actorId;
    entity.targetId = domain.targetId;
    entity.action = domain.action;
    entity.context = domain.context;
    entity.metadata = domain.metadata;
    entity.createdAt = domain.createdAt;

    return entity;
  }
}
