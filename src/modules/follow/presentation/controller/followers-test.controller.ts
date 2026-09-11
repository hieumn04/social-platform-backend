import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { GetFollowersWithScoresUseCase } from '@/modules/follow/application/orchestrators/get-followers-with-scores/get-followers-with-scores.usecase';
import { GetFollowersInput } from '@/modules/follow/application/usecase/getFollowers/get-followers.input';
import { ShowManyFriendshipsUseCase } from '@/modules/follow/application/usecase/show-many-friendships/show-many-friendships.usecase';
import { GetFollowersQueryDto } from '@/modules/follow/presentation/dto/getFollowersQueryDto';
import { ShowManyFriendshipsDto } from '@/modules/follow/presentation/dto/showManyFriendshipsQuery.dto';
import { AccessTokenPayload } from '@/types/token/token.types';
import { FollowersCursor } from '@/types/typeModel/follows';

import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Test Followers')
@Controller('test/followers')
export class FollowersTestController {
  constructor(
    private readonly getFollowersWithScoresUseCase: GetFollowersWithScoresUseCase,
    private readonly showManyFriendshipsUseCase: ShowManyFriendshipsUseCase,
  ) {}

  @Get('/scores')
  @ApiOperation({
    summary: 'Test lấy followers + score snapshots',
  })
  async getFollowersWithScores(@Query() query: GetFollowersQueryDto) {
    const { viewerId, targetUserId, limit, cursorCreatedAt, cursorFollowerId } =
      query;

    if (!viewerId) {
      throw new BadRequestException('viewerId is required');
    }

    if (!targetUserId) {
      throw new BadRequestException('targetUserId is required');
    }

    let cursor: FollowersCursor | undefined;

    if (cursorCreatedAt && cursorFollowerId) {
      cursor = {
        createdAt: cursorCreatedAt,
        followerId: cursorFollowerId,
      };
    }

    const input: GetFollowersInput = {
      viewerId,
      targetUserId,
      limit: limit ?? 20,
      cursor,
    };

    const result = await this.getFollowersWithScoresUseCase.execute(input);

    return {
      success: true,
      data: result,
    };
  }

  @ApiBearerAuth()
  @Post('show_many')
  @UseGuards(JwtAuthGuard)
  async showMany(@Body() dto: ShowManyFriendshipsDto, @Req() req: Request) {
    const user = req.user as AccessTokenPayload;

    // DTO đã validate regex rồi
    const userIds = dto.user_ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const uniqueUserIds = [...new Set(userIds)];

    const result = await this.showManyFriendshipsUseCase.execute({
      viewerId: user.sub,
      userIds: uniqueUserIds,
    });

    return {
      friendship_statuses: result.friendship_statuses,
      status: 'ok',
    };
  }
}
