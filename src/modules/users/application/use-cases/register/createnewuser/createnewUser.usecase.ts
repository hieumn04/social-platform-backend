import {
  Inject,
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateNewUserInput } from './createNewUser.input';
import { CreateNewUserOutput } from './createNewUser.output';
import { UserWriteRepository } from '@/modules/users/domain/repositories/user-write.interface.repository';
import { AppLogger } from 'src/shared/logger/applogger';
import { User } from 'src/modules/users/domain/models/user.model';
import { EntityManager } from 'typeorm';
import { SnowflakeIdGenerator } from '@/shared/snowflake-generator/snowflakeId-generator';
import {
  normalizeUsername,
  validateUsername,
} from '@/modules/users/domain/policies/username.policy';

@Injectable()
export class CreateNewUserUseCase {
  constructor(
    @Inject('UserWriteRepository')
    private readonly userRepo: UserWriteRepository,
    private readonly idGenerator: SnowflakeIdGenerator,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    input: CreateNewUserInput,
    manager?: EntityManager,
  ): Promise<CreateNewUserOutput> {
    const { fullName, email, username, passwordHash, phoneNumber, identityId } =
      input.userProps;

    if (!fullName?.trim()) {
      throw new BadRequestException('Full name is required');
    }
    const normalizedUsername = normalizeUsername(username || '');
    const usernameValidationError = validateUsername(normalizedUsername);
    if (usernameValidationError) {
      throw new BadRequestException(usernameValidationError.message);
    }
    if (!passwordHash) {
      throw new BadRequestException('Password hash is required');
    }
    if (!email && !phoneNumber) {
      throw new BadRequestException(
        'Either email or phone number must be provided',
      );
    }

    if (!identityId) {
      throw new BadRequestException('IdentityId is required');
    }

    if (await this.userRepo.existsByUsername(normalizedUsername, manager)) {
      throw new ConflictException(
        `The username ${normalizedUsername} is not available.`,
      );
    }

    const userId = this.idGenerator.nextId();

    try {
      const userDomain = User.createVerified(userId, {
        ...input.userProps,
        username: normalizedUsername,
      });

      await this.userRepo.insert(userDomain, manager);

      this.logger.log('User created successfully', {
        userId,
        email,
        phoneNumber,
      });

      return new CreateNewUserOutput('User created successfully', true, userId);
    } catch (err: unknown) {
      this.logger.error('User creation failed', {
        error: err as Error,
      });
      throw err;
    }

    return new CreateNewUserOutput('User creation failed', false, userId);
  }
}
