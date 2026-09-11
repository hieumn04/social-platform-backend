import { Inject, Injectable } from '@nestjs/common';

import { AppLogger } from 'src/shared/logger/applogger';
import { ValidateInputUser } from './input';
import { ValidateInputUserOutput } from './output';
import { Method } from 'src/shared/enums/statusRegister.enum';
import { Email } from 'src/modules/value-objects/email';
import { PhoneNumber } from 'src/modules/value-objects/phonenumber';
import { Password } from 'src/modules/value-objects/password';
import { UserWriteRepository } from '@/modules/users/domain/repositories/user-write.interface.repository';
import {
  normalizeUsername,
  validateUsername,
} from '@/modules/users/domain/policies/username.policy';

@Injectable()
export class ValidateInputUserUseCase {
  constructor(
    @Inject('UserWriteRepository')
    private readonly userRepo: UserWriteRepository,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: ValidateInputUser): Promise<ValidateInputUserOutput> {
    const { fullName, username, email, phoneNumber, password, gender } =
      input.userRegister;

    const { purpose, ip, deviceId } = input;

    if (!purpose || Method.REGISTER !== purpose) {
      return { isValid: false, message: 'Purpose is required' };
    }

    if (!ip || !deviceId) {
      return { isValid: false, message: 'Ip and DeviceId is required' };
    }

    if (!fullName || fullName.trim().length < 2) {
      return { isValid: false, message: 'Fullname is invalid' };
    }
    const normalizedUsername = normalizeUsername(username || '');
    const usernameValidationError = validateUsername(normalizedUsername);
    if (usernameValidationError) {
      return { isValid: false, message: usernameValidationError.message };
    }

    const existingUsername =
      await this.userRepo.existsByUsername(normalizedUsername);
    if (existingUsername) {
      return {
        isValid: false,
        message: `The username ${normalizedUsername} is not available.`,
      };
    }

    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }

    if (!email && !phoneNumber) {
      return {
        isValid: false,
        message: 'Either email or phone number is required',
      };
    }

    let emailVO: Email | undefined;
    let phoneNumberVO: PhoneNumber | undefined;
    let passwordVO: Password;

    try {
      passwordVO = await Password.create(password);
    } catch (err) {
      this.logger.error('Invalid password', { error: err });
      return {
        isValid: false,
        message:
          'Password invalid: must be ≥8 characters, include uppercase, lowercase, number, and special character',
      };
    }

    if (email) {
      try {
        emailVO = Email.create(email);
      } catch (err) {
        this.logger.error('Invalid email', { error: err });
        return {
          isValid: false,
          message: 'Invalid email or email is in the blacklist',
        };
      }

      const existingUser = await this.userRepo.existsByEmail(emailVO);
      if (existingUser) {
        return { isValid: false, message: 'Email is already in use' };
      }
    }

    if (phoneNumber) {
      try {
        phoneNumberVO = PhoneNumber.create(phoneNumber);
      } catch (err) {
        this.logger.error('Invalid phone number', { error: err });
        return { isValid: false, message: 'Phone number is invalid' };
      }
    }

    return {
      isValid: true,
      userRegisterResult: {
        fullName,
        username: normalizedUsername,
        passwordHash: passwordVO,
        email: emailVO,
        phoneNumber: phoneNumberVO,
        gender,
      },
      deviceId: deviceId,
      ip: ip,
      purpose: purpose,
    };
  }
}
