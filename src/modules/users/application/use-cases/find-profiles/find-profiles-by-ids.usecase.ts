import { UserReadRepository } from '@/modules/users/domain/repositories/user-read.interface.repository';
import { UserProfileQueryRow } from '@/types/typeModel/user-raw.type';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetUserProfilesByIdsUseCase {
  constructor(
    @Inject('UserReadRepository')
    private readonly userReadRepository: UserReadRepository,
  ) {}

  async execute(ids: readonly string[]): Promise<UserProfileQueryRow[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    if (ids.length > 500) {
      console.log('Too many ids requested', { count: ids.length });
    }

    return this.userReadRepository.findProfilesByIds(ids);
  }
}
