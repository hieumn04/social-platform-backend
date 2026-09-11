import { GetProfileInitialUseCase } from '@/modules/profile/application/usecases/get-profile-initial.usecase';
import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { AccessTokenPayload } from '@/types/token/token.types';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import {
  BadRequestException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

interface GraphqlRequestContext {
  req: Request;
}

@Resolver('Query')
@UseGuards(JwtAuthGuard)
export class ProfileResolver {
  constructor(
    private readonly getProfileInitialUseCase: GetProfileInitialUseCase,
  ) {}

  @Query('get_profile_initial')
  async getProfileInitial(
    @Args('userID') userId: string,
    @Context() context: GraphqlRequestContext,
  ) {
    if (!/^\d+$/.test(userId)) {
      throw new BadRequestException('userID must be a numeric ID');
    }

    const viewer = context.req.user as AccessTokenPayload;
    if (!viewer?.sub) throw new UnauthorizedException('Unauthorized');

    return this.getProfileInitialUseCase.execute(viewer.sub, userId);
  }
}
