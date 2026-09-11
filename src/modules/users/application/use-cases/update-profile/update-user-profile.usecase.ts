import { Inject, Injectable } from '@nestjs/common';

import { UserDomainService } from '../../../domain/domain-service/user.domain-service';
import { UserRepository } from '../../../domain/repositories/user-write.interface.repository';
import { UpdateUserProfileInput } from './update-user-profile.input';

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepo: UserRepository,
    private readonly userDomainService: UserDomainService,
  ) {}

  async execute(input: UpdateUserProfileInput): Promise<null> {
    const user = await this.userRepo.findById(input.fullName);

    if (!user) {
      throw new Error('User not found');
    }

    if (!this.userDomainService.canUpdateProfile(user)) {
      throw new Error('User cannot update profile');
    }

    user.updateProfileDetails(input.fullName, input.address, input.gender);
    await this.userRepo.save(user);
    return null;
    // user.fullname,
    // // user.address,
    // user.updatedAt,
    // user.gender,
  }
}
