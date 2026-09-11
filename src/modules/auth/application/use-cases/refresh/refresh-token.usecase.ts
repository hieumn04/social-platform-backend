import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenServiceImpl } from 'src/modules/auth/infrastructure/service/token.service.imp';
import { AppLogger } from 'src/shared/logger/applogger';
import { RefreshTokenInput } from './refresh-token.input';
import { RefreshTokenOutput } from './refresh-token.output';
import { AccessTokenPayload } from 'src/types/token/token.types';
import { Email } from 'src/modules/value-objects/email';
import { PhoneNumber } from 'src/modules/value-objects/phonenumber';
import { buildIdentifierFromString } from 'src/helpers/helper';
import { Method } from 'src/shared/enums/statusRegister.enum';

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly tokenService: TokenServiceImpl,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RefreshUseCase.name);
  }

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const { user, meta, sessionData } = input;

    if (!user) {
      throw new BadRequestException('User is required.');
    }

    const userId = user.sub;

    const { identifier, role, deviceId, sub } = sessionData;

    if (sub !== userId) {
      throw new UnauthorizedException('User ID does not match session.');
    }

    let email: Email | undefined;
    let phoneNumber: PhoneNumber | undefined;
    try {
      const result = buildIdentifierFromString(identifier);
      email = result.email;
      phoneNumber = result.phoneNumber;
    } catch (err: unknown) {
      this.logger.error(
        `Invalid identifier format: ${(err as Error).message}`,
        { identifier, userId },
      );
      throw new BadRequestException('Invalid identifier format.');
    }

    const accessPayload: Omit<AccessTokenPayload, 'jti'> = {
      sub: userId,
      deviceId,
      role,
      email: email?.getValue(),
      phoneNumber: phoneNumber?.getValue(),
    };

    let accessTokenData;
    try {
      accessTokenData = await this.tokenService.refreshToken(accessPayload, {
        purpose: Method.REFRESH,
        type: 'cacheRedis',
        meta,
      });
    } catch (err: unknown) {
      this.logger.error(
        `Failed to generate access token: ${(err as Error).message}`,
        { userId, deviceId },
      );
      throw new InternalServerErrorException(
        'Failed to generate access token.',
      );
    }

    this.logger.log('Successfully refreshed access token', {
      userId,
      deviceId,
    });

    return new RefreshTokenOutput(
      'Successfully refreshed access token',
      true,
      accessTokenData.accessToken,
      accessTokenData.accessExpiresIn,
      user.jti,
    );
  }
}
