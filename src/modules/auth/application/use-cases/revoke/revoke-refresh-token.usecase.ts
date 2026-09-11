import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RevokeTokenInput } from './revoke-refresh-token.input';
import { RevokeTokenOutput } from './revoke-refresh-token.output';
import { TokenServiceImpl } from 'src/modules/auth/infrastructure/service/token.service.imp';
import { AppLogger } from 'src/shared/logger/applogger';

@Injectable()
export class RevokeUseCase {
  constructor(
    private readonly tokenService: TokenServiceImpl,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('RevokeUseCase');
  }

  async execute(input: RevokeTokenInput): Promise<RevokeTokenOutput> {
    const { accessTokenRaw, refreshTokenRaw, sessionId } = input;

    if (!refreshTokenRaw) {
      throw new BadRequestException('Refresh token is required.');
    }

    const refreshPayload = this.tokenService.decodeToken(
      'refreshToken',
      refreshTokenRaw,
    );
    if (!refreshPayload || !refreshPayload.jti) {
      throw new BadRequestException('Invalid refresh token.');
    }
    const jtiRefresh = refreshPayload.jti;

    let jtiAccess: string | undefined;

    if (accessTokenRaw) {
      const accessPayload = this.tokenService.decodeToken(
        'accessToken',
        accessTokenRaw,
      );
      jtiAccess = accessPayload?.jti;
    }

    this.logger.log('Revoking tokens', {
      sessionId,
      jtiAccess,
      jtiRefresh,
    });

    try {
      await this.tokenService.revokeToken(jtiAccess, jtiRefresh, sessionId);

      this.logger.log('Successfully revoked tokens', {
        sessionId,
        jtiAccess,
        jtiRefresh,
      });

      return new RevokeTokenOutput('Success', true);
    } catch (err: unknown) {
      this.logger.error(`Failed to revoke tokens: ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to revoke tokens');
    }
  }
}
