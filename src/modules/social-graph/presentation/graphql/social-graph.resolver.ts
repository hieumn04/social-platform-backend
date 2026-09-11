import { FollowUserUseCase } from '@/modules/social-graph/application/usecases/follow-user.usecase';
import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { AccessTokenPayload } from '@/types/token/token.types';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import {
  BadRequestException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

interface GraphqlRequestContext {
  req: Request;
}

@Resolver('Mutation')
@UseGuards(JwtAuthGuard)
export class SocialGraphResolver {
  constructor(private readonly followUserUseCase: FollowUserUseCase) {}

  @Mutation('xdt_create_friendship')
  async createFriendship(
    @Args('target_user_id') targetUserId: string,
    @Context() context: GraphqlRequestContext,
  ) {
    if (!/^\d+$/.test(targetUserId)) {
      throw new BadRequestException('target_user_id must be a numeric ID');
    }

    const actor = context.req.user as AccessTokenPayload;
    if (!actor?.sub) throw new UnauthorizedException('Unauthorized');

    const result = await this.followUserUseCase.execute(
      actor.sub,
      targetUserId,
    );

    if ('user' in result) {
      return {
        id: result.user.id,
        username: result.user.username,
        friendship_status: result.friendshipStatus,
      };
    }

    throw new BadRequestException('Friendship could not be created');
  }
}
