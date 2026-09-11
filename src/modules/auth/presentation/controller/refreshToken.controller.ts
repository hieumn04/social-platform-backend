import { Body, Controller, Post, Req } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InsertRefreshTokenUseCase } from '../../application/use-cases/insert/insert-refresh-token.usecase';
import { InsertRefreshTokenOutput } from '../../application/use-cases/insert/insert-refresh-token.output';
import { Request } from 'express';
import { InsertRefreshTokenRequestDto } from '../dto/request/insert-refresh-token.request.dto';
import { InsertRefreshTokenMapper } from '../mappers/insert-refresh-token.mapper';

@ApiTags('Auth')
@Controller('auth')
export class RefreshTokenController {
  constructor(
    private readonly insertRefreshTokenUseCase: InsertRefreshTokenUseCase,
  ) {}

  @Post('/insert-refresh-token')
  @ApiOperation({ summary: 'Insert refresh token manually (for testing)' })
  @ApiResponse({
    status: 200,
    description: 'Insert refresh token result',
    type: InsertRefreshTokenOutput,
  })
  async insertRefreshToken(
    @Body() body: InsertRefreshTokenRequestDto,
    @Req() req: Request,
  ): Promise<InsertRefreshTokenOutput> {
    const input = InsertRefreshTokenMapper.toInput(body, req);
    const output = await this.insertRefreshTokenUseCase.execute(input);
    return InsertRefreshTokenMapper.toResponse(output);
  }
}
