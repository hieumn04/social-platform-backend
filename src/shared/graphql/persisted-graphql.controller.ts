import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { Request } from 'express';
import { GraphqlExecutorService } from '@/shared/graphql/graphql-executor.service';
import { PersistedGraphqlDto } from '@/shared/graphql/dto/persisted-graphql.dto';
import { PERSISTED_QUERY_REGISTRY } from '@/shared/graphql/persisted-queries.registry';
import { ApiExcludeController } from '@nestjs/swagger';
@ApiExcludeController()
@Controller('/api/graphql')
@UseGuards(JwtAuthGuard)
export class PersistedGraphqlController {
  constructor(private readonly executor: GraphqlExecutorService) {}

  @Post()
  async handle(@Body() body: PersistedGraphqlDto, @Req() req: Request) {
    if ((body as any).query) {
      throw new BadRequestException('Direct query not allowed');
    }

    if (!body.doc_id) {
      throw new BadRequestException('Missing doc_id');
    }

    if (!/^\d+$/.test(body.doc_id)) {
      throw new BadRequestException('Invalid doc_id');
    }

    const document = PERSISTED_QUERY_REGISTRY[body.doc_id];

    if (!document) {
      throw new BadRequestException('Unknown doc_id');
    }

    if (body.variables && typeof body.variables !== 'object') {
      throw new BadRequestException('Invalid variables');
    }

    const result = await this.executor.execute(document, body.variables, {
      req,
      user: req.user,
    });

    if (result.errors) {
      console.error(result.errors);
    }

    return result;
  }
}
