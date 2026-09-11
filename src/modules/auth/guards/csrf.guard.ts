import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { AppLogger } from 'src/shared/logger/applogger';
import { TokenServiceImpl } from '../infrastructure/service/token.service.imp';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    @Inject(TokenServiceImpl)
    private readonly tokenService: TokenServiceImpl,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CsrfGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const sessionId = request.cookies?.sessionId;
    const csrfToken = request.cookies?.csrfToken;
    const deviceId = request.deviceId;

    if (!sessionId || !csrfToken) {
      throw new BadRequestException('Session cookies are missing.');
    }

    const sessionData = await this.tokenService.getSessionId(sessionId);
    if (!sessionData) {
      this.logger.warn(`Session not found or expired. sessionId=${sessionId}`);
      throw new UnauthorizedException('Invalid session or CSRF token.');
    }

    if (sessionData.csrfToken !== csrfToken) {
      this.logger.warn(`CSRF token mismatch for sessionId=${sessionId}`);
      throw new UnauthorizedException('Invalid session or CSRF token.');
    }

    if (sessionData.deviceId !== deviceId) {
      this.logger.warn(
        `DeviceId mismatch for sessionId=${sessionId} (expected=${sessionData.deviceId}, got=${deviceId})`,
      );
      throw new UnauthorizedException('Invalid session.');
    }

    request.session = sessionData;

    return true;
  }
}
