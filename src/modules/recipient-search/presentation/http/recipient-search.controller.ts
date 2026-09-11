import { SearchRecipientsUseCase } from '@/modules/recipient-search/application/usecases/search-recipients.usecase';
import { SearchRecipientsQueryDto } from '@/modules/recipient-search/presentation/http/dto/search-recipients.query.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { AccessTokenPayload } from '@/types/token/token.types';
import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

@Controller('api/recipients')
@UseGuards(JwtAuthGuard)
export class RecipientSearchController {
  constructor(private readonly useCase: SearchRecipientsUseCase) {}

  @Get('search')
  async search(
    @Query() query: SearchRecipientsQueryDto,
    @Req() request: Request,
  ) {
    const viewer = request.user as AccessTokenPayload;
    if (!viewer?.sub) throw new UnauthorizedException('Unauthorized');

    return this.useCase.execute(viewer.sub, query.query, query.limit);
  }
}
