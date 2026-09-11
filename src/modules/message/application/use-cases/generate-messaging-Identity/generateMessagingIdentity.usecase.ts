import { MessagingActor } from '@/modules/message/domain/models/messagingIdentity.model';
import { MessagingIdentityRepository } from '@/modules/message/domain/repositories/messagingIdentity.repository.interface';
import { SnowflakeIdGenerator } from '@/shared/snowflake-generator/snowflakeId-generator';
import { Inject } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export class GenerateMessagingIdentityUseCase {
  constructor(
    private readonly idGenerator: SnowflakeIdGenerator,
    @Inject('MessagingIdentityRepository')
    private readonly messageIdentityRepo: MessagingIdentityRepository,
  ) {}

  async execute(
    userId: string,
    manager?: EntityManager,
  ): Promise<{ interopMessagingUserFbid: string }> {
    const id = this.idGenerator.nextId();

    const identity = MessagingActor.createNew(id, {
      userId,
    });

    await this.messageIdentityRepo.insert(
      {
        userId: identity.userId,
        interopMessagingUserFbid: identity.id,
        platform: identity.platform,
      },
      manager,
    );

    return {
      interopMessagingUserFbid: id,
    };
  }
}
