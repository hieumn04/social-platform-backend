import {
  normalizeUsername,
  UsernameValidationCode,
  validateUsername,
} from '@/modules/users/domain/policies/username.policy';
import { UserWriteRepository } from '@/modules/users/domain/repositories/user-write.interface.repository';
import { Inject, Injectable } from '@nestjs/common';

export interface CheckUsernameAvailabilityResult {
  available: boolean;
  username: string;
  reason?: UsernameValidationCode | 'USERNAME_TAKEN';
  message?: string;
}

@Injectable()
export class CheckUsernameAvailabilityUseCase {
  constructor(
    @Inject('UserWriteRepository')
    private readonly userRepository: UserWriteRepository,
  ) {}

  async execute(rawUsername: string): Promise<CheckUsernameAvailabilityResult> {
    const username = normalizeUsername(rawUsername || '');
    const validationError = validateUsername(username);

    if (validationError) {
      return {
        available: false,
        username,
        reason: validationError.code,
        message: validationError.message,
      };
    }

    if (await this.userRepository.existsByUsername(username)) {
      return {
        available: false,
        username,
        reason: 'USERNAME_TAKEN',
        message: `The username ${username} is not available.`,
      };
    }

    return { available: true, username };
  }
}
