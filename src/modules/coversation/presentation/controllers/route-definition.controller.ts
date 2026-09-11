import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { ResolveThreadUseCase } from '@/modules/coversation/application/use-cases/routedefinition/resolve-thread.usecase';

import { AccessTokenPayload } from '@/types/token/token.types';
import { Request } from 'express';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ResolveThreadQueryDto } from '@/modules/coversation/presentation/dto/resolve-thread.query.dto';

@Controller('ajax')
export class InboxThreadRouteController {
  constructor(private readonly resolveThreadUseCase: ResolveThreadUseCase) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('route-definition')
  async resolveThread(
    @Req() req: Request,
    @Query() query: ResolveThreadQueryDto,
  ) {
    const user = req.user as AccessTokenPayload;

    const result = await this.resolveThreadUseCase.execute(
      user.sub,
      query.threadKey,
    );

    return {
      type: 'route_definition',
      payload: {
        actorID: user.sub,
        thread_key: result.threadKey,
        thread_fbid: result.threadFbid,
      },
    };
  }
}