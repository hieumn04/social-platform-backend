// insert-refresh-token.usecase.ts
import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InsertRefreshTokenInput } from './insert-refresh-token.input';
import { InsertRefreshTokenOutput } from './insert-refresh-token.output';
import { RefreshTokenRepository } from 'src/modules/auth/domain/repositories/refreshToken.repository.interface';
import { RefreshToken } from 'src/modules/auth/domain/models/refreshToken';
import { AppLogger } from 'src/shared/logger/applogger';

@Injectable()
export class InsertRefreshTokenUseCase {
  constructor(
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('InsertRefreshTokenUseCase');
  }

  async execute(
    input: InsertRefreshTokenInput,
  ): Promise<InsertRefreshTokenOutput> {
    try {
      if (!input.refreshToken || !input.jti) {
        return new InsertRefreshTokenOutput(
          'refreshToken and jti are required',
          false,
        );
      }
      if (!input.refreshTokenProps.userId) {
        return new InsertRefreshTokenOutput('userId is required', false);
      }
      if (!input.refreshTokenProps.expiredAt) {
        return new InsertRefreshTokenOutput('expiredAt is required', false);
      }
      if (!input.refreshTokenProps.ipAddress) {
        return new InsertRefreshTokenOutput('ipAddress is required', false);
      }
      if (!input.refreshTokenProps.userAgent) {
        return new InsertRefreshTokenOutput('userAgent is required', false);
      }

      const refreshTokenDomain = RefreshToken.createNew(uuidv4(), {
        ...input.refreshTokenProps,
        refreshToken: input.refreshToken,
        jti: input.jti,
      });

      await this.refreshTokenRepo.insert(refreshTokenDomain);
      this.logger.log(
        `Refresh token created successfully for user ${refreshTokenDomain.userId}`,
      );

      return new InsertRefreshTokenOutput(
        'Refresh token inserted successfully',
        true,
      );
    } catch (err: unknown) {
      this.logger.error('Failed to insert refresh token', {
        error: err as Error,
      });
      return new InsertRefreshTokenOutput(
        'Failed to insert refresh token',
        false,
      );
    }
  }
}
