import { Inject, Injectable } from '@nestjs/common';
import { UserWriteRepository } from '@/modules/users/domain/repositories/user-write.interface.repository';
import { AppLogger } from 'src/shared/logger/applogger';
import { LoginUserOutput } from './login.output';
import { LoginUserInput } from './login.input';
import { Account } from 'src/types/typeModel/userProp';
import { detectAccountType, getRoleById } from 'src/helpers/helper';
import { User } from 'src/modules/users/domain/models/user.model';
import { Method } from 'src/shared/enums/statusRegister.enum';
import { Email } from 'src/modules/value-objects/email';
import { PhoneNumber } from 'src/modules/value-objects/phonenumber';
import { Password } from 'src/modules/value-objects/password';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('UserWriteRepository')
    private readonly userRepo: UserWriteRepository,
    private readonly logger: AppLogger,
  ) {
    logger.setContext('LoginUseCase');
  }

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const { accountname, password, requestContext } = input;

    this.logger.debug(
      ` Input received: accountname=${accountname}, passwordLength=${password?.length}, requestContext=${JSON.stringify(
        requestContext,
      )}`,
    );

    if (!accountname || !password) {
      this.logger.warn(' Missing accountname or password');
      return {
        success: false,
        message: 'Accountname and password is required',
        purpose: Method.LOGIN,
      };
    }
    if (!requestContext) {
      this.logger.warn(' Missing requestContext');
      return {
        success: false,
        message: 'RequestContext is required',
        purpose: Method.LOGIN,
      };
    }

    const typeCount = detectAccountType(accountname);
    this.logger.debug(` Detected account type: ${typeCount}`);

    let account: Account;
    try {
      switch (typeCount) {
        case 'email':
          account = { email: Email.create(accountname) };
          this.logger.debug(
            ` Email VO created: ${account?.email ? account.email.getValue() : 'undefined'}`,
          );
          break;
        case 'phoneNumber':
          account = { phoneNumber: PhoneNumber.create(accountname) };
          this.logger.debug(
            `PhoneNumber VO created: ${account.phoneNumber ? account.phoneNumber.getValue() : 'undefined'}`,
          );
          break;
        case 'nickname':
          account = { nickname: accountname };
          this.logger.debug(` Nickname used: ${account.nickname}`);
          break;
        default:
          throw new Error('Invalid account type');
      }
    } catch (err: unknown) {
      this.logger.error(`Error creating account VO: ${(err as Error).message}`);
      throw err;
    }

    let user: User | null = null;
    try {
      switch (typeCount) {
        case 'email':
          user = await this.userRepo.findByEmail(account.email!);
          break;
        case 'phoneNumber':
          user = await this.userRepo.findByPhoneNumber(account.phoneNumber!);
          break;
        case 'nickname':
          this.logger.warn('[LoginUseCase] Login by nickname not implemented');
          break;
      }
    } catch (err: unknown) {
      this.logger.error(` Error querying user: ${(err as Error).message}`);
      throw err;
    }

    if (!user) {
      this.logger.warn(` User not found for account: ${accountname}`);
      return {
        success: false,
        message: 'User not found',
        purpose: Method.LOGIN,
      };
    }

    let isValidPassword = false;
    try {
      isValidPassword = await Password.compare(
        password,
        user.passwordHash!.getValue(),
      );
      this.logger.debug(
        `Password valid for user=${user.userId}: ${isValidPassword}`,
      );
    } catch (err: unknown) {
      this.logger.error(
        ` Password compare error for user=${user.userId}: ${
          (err as Error).message
        }`,
      );

      isValidPassword = false;
    }

    if (!isValidPassword) {
      this.logger.warn(` Invalid password for user: ${user.userId}`);
      return {
        success: false,
        message: 'Invalid password',
        purpose: Method.LOGIN,
      };
    }

    this.logger.debug(` Login successful for user: ${user.userId}`);
    return {
      success: true,
      message: 'Login successful',
      purpose: Method.LOGIN,
      userInfo: {
        roleId: user.roleId ? getRoleById(user.roleId).name : undefined,
        userId: user.userId,
        identifier: accountname,
      },
      meta: { requestContext },
    };
  }
}
