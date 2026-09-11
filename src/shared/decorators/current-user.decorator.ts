import { AccessTokenPayload } from '@/types/token/token.types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload => {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    return req.user;
  },
);
