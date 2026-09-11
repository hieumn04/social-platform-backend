import { Injectable } from '@nestjs/common';

import { GenarateTokenPairUseCase } from 'src/modules/auth/application/register/genaratetokenpair.use-case';
import { LoginUseCase } from 'src/modules/users/application/use-cases/login/login.usecase';
import { LoginUserInput } from 'src/modules/users/application/use-cases/login/login.input';
import { LoginUserOutput } from './LoginUserOutput';

@Injectable()
export class LoginUserUseCases {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly generateTokenPairUseCase: GenarateTokenPairUseCase,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const requestContextResult = input.requestContext;
    const loginResult = await this.loginUseCase.execute(input);

    if (!loginResult.success && !loginResult.message) {
      return new LoginUserOutput('Login Failed', false);
    }

    const { userInfo, purpose } = loginResult;

    if (!userInfo || !purpose) {
      return new LoginUserOutput('No found userInfo and purpose', false);
    }

    const tokenResult = await this.generateTokenPairUseCase.execute({
      userInfo: userInfo,
      purpose: purpose,
      meta: {
        requestContext: requestContextResult,
      },
    });

    return new LoginUserOutput('Login successful', true, tokenResult.tokens);
  }
}
