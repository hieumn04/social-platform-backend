import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { isObservable, lastValueFrom } from 'rxjs';
import { AppLogger } from 'src/shared/logger/applogger';
import { AccessTokenPayload } from 'src/types/token/token.types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(AppLogger)
    private readonly logger: AppLogger,
  ) {
    super();
    this.logger.setContext(JwtAuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivateResult = super.canActivate(context);
    const active =
      typeof canActivateResult === 'boolean'
        ? canActivateResult
        : isObservable(canActivateResult)
          ? await lastValueFrom(canActivateResult)
          : await canActivateResult;

    return active;
  }

  getRequest(context: ExecutionContext): Request {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<Request>();
    }

    const gqlCtx = GqlExecutionContext.create(context);
    return gqlCtx.getContext().req;
  }

  handleRequest(
    err: unknown,
    user: AccessTokenPayload,
    info: any,
    context: ExecutionContext,
  ): any {
    const req = this.getRequest(context);

    if (err) {
      if (err instanceof Error) {
        this.logger.warn(`Access token validation failed: ${err.message}`, {
          context: JwtAuthGuard.name,
          stack: err.stack,
          ip: req.ip,
          deviceId: req.deviceId || null,
        });
      } else {
        this.logger.warn(`Access token validation failed`, {
          context: JwtAuthGuard.name,
          ip: req.ip,
          deviceId: req.deviceId || null,
        });
      }
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException('Unauthorized');
    }

    if (!user) {
      const deviceId = req.deviceId;

      this.logger.warn(`Access token rejected: user not found`, {
        deviceId,
        ip: req.ip,
      });

      throw new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
