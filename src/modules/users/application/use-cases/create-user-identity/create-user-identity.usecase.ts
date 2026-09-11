import { Inject } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UserIdentity } from '@/modules/users/domain/models/user-identity.model';
import { UserIdentityRepository } from '@/modules/users/domain/repositories/user-identity.repository.interface';
import { SnowflakeIdGenerator } from '@/shared/snowflake-generator/snowflakeId-generator';

export class GenerateUserIdentityUseCase {
  constructor(
    private readonly idGenerator: SnowflakeIdGenerator,
    @Inject('UserIdentityRepository')
    private readonly userIdentityRepo: UserIdentityRepository,
  ) {}

  async execute(manager?: EntityManager): Promise<{ identityId: string }> {
    const identityId = this.idGenerator.nextId();
    const fbidV2 = this.idGenerator.nextId();

    const userIdentity = UserIdentity.createNew({
      identityId: identityId,
      fbidV2: fbidV2,
    });

    await this.userIdentityRepo.insert(userIdentity, manager);

    return {
      identityId,
    };
  }
}
