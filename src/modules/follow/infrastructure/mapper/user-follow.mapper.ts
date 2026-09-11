import { UserFollow } from '@/modules/follow/domain/models/user-follow';
import { UserFollowEntity } from '@/modules/follow/infrastructure/typeorm/follows.entity';

export class UserFollowMapper {
  static toDomain(entity: UserFollowEntity): UserFollow {
    return new UserFollow(entity.followerId, entity.followingId, {
      status: entity.status,

      isBestie: entity.isBestie,
      isFeedFavorite: entity.isFeedFavorite,
      isRestricted: entity.isRestricted,

      notifyStory: entity.notifyStory,
      notifyPost: entity.notifyPost,
      notifyLive: entity.notifyLive,

      mutedStory: entity.mutedStory,
      mutedPost: entity.mutedPost,

      interactionRank: entity.interactionRank,
      lastInteractionAt: entity.lastInteractionAt,

      createdAt: entity.createdAt,
      acceptedAt: entity.acceptedAt,
      removedAt: entity.removedAt,
    });
  }

  static toPersistence(domain: UserFollow): UserFollowEntity {
    const obj = domain.toObject();

    const entity = new UserFollowEntity();
    entity.followerId = obj.followerId;
    entity.followingId = obj.followingId;

    entity.status = obj.status;

    entity.isBestie = obj.isBestie;
    entity.isFeedFavorite = obj.isFeedFavorite;
    entity.isRestricted = obj.isRestricted;

    entity.notifyStory = obj.notifyStory;
    entity.notifyPost = obj.notifyPost;
    entity.notifyLive = obj.notifyLive;

    entity.mutedStory = obj.mutedStory;
    entity.mutedPost = obj.mutedPost;

    entity.interactionRank = obj.interactionRank;
    entity.lastInteractionAt = obj.lastInteractionAt;

    entity.createdAt = obj.createdAt;
    entity.acceptedAt = obj.acceptedAt;
    entity.removedAt = obj.removedAt;

    return entity;
  }
}
