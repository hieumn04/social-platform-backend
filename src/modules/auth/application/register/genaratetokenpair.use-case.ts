import { Injectable } from '@nestjs/common';
import { TokenServiceImpl } from '../../infrastructure/service/token.service.imp';
import { GenarateTokenPairUserInput } from './genaratetokenpair-input.usecase';
import { GenarateTokenUserOutput } from './genaratetokenpair-output.usecase';
import { Method } from 'src/shared/enums/statusRegister.enum';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPairResult,
} from 'src/types/token/token.types';
import { getRoleById, buildIdentifierFromString } from 'src/helpers/helper';
import { AppLogger } from 'src/shared/logger/applogger';

@Injectable()
export class GenarateTokenPairUseCase {
  constructor(
    private readonly tokenServiceImp: TokenServiceImpl,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GenarateTokenPairUseCase.name);
  }

  async execute(
    input: GenarateTokenPairUserInput,
  ): Promise<GenarateTokenUserOutput> {
    const { purpose, userInfo, meta } = input;

    if (!userInfo) {
      this.logger.error('Missing userInfo in input');
      return new GenarateTokenUserOutput('Missing userInfo', false);
    }

    if (
      !purpose ||
      (purpose !== Method.LOGIN && purpose !== Method.EXPIREDREFRESH)
    ) {
      this.logger.error('Invalid purpose in input');
      return new GenarateTokenUserOutput('Invalid purpose', false);
    }

    if (!meta) {
      this.logger.error('Missing meta in input');
      return new GenarateTokenUserOutput('Missing meta', false);
    }

    if (!userInfo.roleId) {
      this.logger.error('Missing roleId in userInfo');
      return new GenarateTokenUserOutput('Missing roleId', false);
    }

    let email: string | undefined;
    let phoneNumber: string | undefined;
    let identifierType: 'email' | 'phone';

    try {
      const result = buildIdentifierFromString(userInfo.identifier);
      email = result.email?.getValue();
      phoneNumber = result.phoneNumber?.getValue();
      identifierType = result.identifierType!;
    } catch (err: unknown) {
      this.logger.error(
        `Invalid identifier format for user ${userInfo.userId}: ${(err as Error).message}`,
      );
      return new GenarateTokenUserOutput(
        'User must have valid email or phone identifier',
        false,
      );
    }

    const roleName = userInfo.roleId;

    const accessPayload: Omit<AccessTokenPayload, 'jti'> = {
      sub: userInfo.userId,
      deviceId: meta.requestContext.deviceId,
      role: roleName,
      email,
      phoneNumber,
    };

    const refreshPayload: Omit<RefreshTokenPayload, 'jti'> = {
      sub: userInfo.userId,
      requestContext: meta.requestContext,
      ip: meta.requestContext.ip,
    };

    this.logger.log('Generating token pair...', {
      userId: userInfo.userId,
      identifier: userInfo.identifier,
      role: roleName,
    });

    const tokenPair = await this.tokenServiceImp.createTokenPair(
      accessPayload,
      refreshPayload,
      {
        purpose,
        type: 'cacheRedis',
        meta,
        identifier: identifierType === 'email' ? email! : phoneNumber!,
        role: roleName,
      },
    );

    this.logger.log('Raw tokenPair returned from service:', tokenPair);

    if (!tokenPair || !tokenPair.refreshToken) {
      this.logger.error('tokenPair or refreshToken is undefined!', {
        tokenPair,
      });
      return new GenarateTokenUserOutput('Failed to generate tokens', false);
    }

    const mappedTokenPair: TokenPairResult = {
      accessToken: {
        token: tokenPair.accessToken,
        expiresIn: tokenPair.accessExpiresIn,
        jti: tokenPair.accessJti,
        scope: 'access',
      },
      refreshToken: {
        token: tokenPair.refreshToken,
        expiresIn: tokenPair.refreshExpiresIn,
        jti: tokenPair.refreshJti,
        scope: 'refresh',
        csrfToken: tokenPair.csrfToken!,
        sessionId: tokenPair.sessionId!,
        expiresInSession: tokenPair.ttlSessionId,
      },
    };

    return new GenarateTokenUserOutput('Success', true, mappedTokenPair);
  }
}
