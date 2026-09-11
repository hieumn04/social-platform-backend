import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { isObservable, lastValueFrom } from 'rxjs';
import { AppLogger } from 'src/shared/logger/applogger';
import { SessionService } from 'src/modules/auth/domain/domain-service/session.service';

import { RefreshTokenPayload } from 'src/types/token/token.types';

@Injectable()
export class SessionGuard extends AuthGuard('jwt-refresh') {
  constructor(
    @Inject(AppLogger)
    private readonly logger: AppLogger,

    @Inject(SessionService)
    private readonly sessionService: SessionService,
  ) {
    super();
    this.logger.setContext(SessionGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivateResult = super.canActivate(context);

    const active =
      typeof canActivateResult === 'boolean'
        ? canActivateResult
        : isObservable(canActivateResult)
          ? await lastValueFrom(canActivateResult)
          : await canActivateResult;

    if (!active) return false;

    const req = context.switchToHttp().getRequest<Request>();
    const payload = req.user as RefreshTokenPayload;

    if (!payload) {
      this.logger.warn('SessionGuard: missing payload');
      throw new UnauthorizedException('Invalid session');
    }

    // const storedFingerprint = this.sessionService.buildFingerprint(
    //   payload.sessionContext,
    // );
    // const currentFingerprint = this.sessionService.buildFingerprint({
    //   deviceId: req.deviceId,
    //   deviceInfo: req.deviceInfo,
    //   ip: req.ip,
    // });

    // const compare = this.sessionService.compareUserAgent(
    //   storedFingerprint,
    //   currentFingerprint,
    // );

    // if (compare.matchLevel === 'none') {
    //   this.logger.warn('Session fingerprint mismatch', {
    //     userId: payload.sub,
    //     differences: compare.differences,
    //   });
    //   throw new UnauthorizedException('Session fingerprint mismatch');
    // }

    // req.compareResult = compare;
    return true;
  }

  handleRequest(
    err: unknown,
    user: RefreshTokenPayload,
    info: any,
    context: ExecutionContext,
  ): any {
    const req = context.switchToHttp().getRequest<Request>();

    if (err || info) {
      this.logger.warn(`Refresh token validation failed`, {
        message: (err as Error)?.message || (info as Error)?.message,
        requestId: req.requestId,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user) {
      this.logger.warn('User not found in refresh token', {
        requestId: req.requestId,
      });
      throw new UnauthorizedException('User not found');
    }
    this.logger.log('Refresh token validated successfully', {
      userId: user.sub,
      requestId: req.requestId,
    });

    return user;
  }
}
