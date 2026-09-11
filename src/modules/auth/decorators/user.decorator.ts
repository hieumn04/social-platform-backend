import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { CompareResult } from 'src/types/token/refreshToken.props';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from 'src/types/token/token.types';

export const AuthUser = createParamDecorator(
  (data: keyof AccessTokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AccessTokenPayload | undefined;
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return data ? user[data] : user;
  },
);

export const RefreshUser = createParamDecorator(
  (
    data: keyof (RefreshTokenPayload & CompareResult) | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as
      | (RefreshTokenPayload & CompareResult)
      | undefined;

    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    return data ? user[data] : user;
  },
);
