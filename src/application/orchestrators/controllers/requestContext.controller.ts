import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequestContextService } from 'src/shared/context/request-context.service';

@ApiTags('Request Context')
@Controller('Request-Context')
export class RequestContextController {
  constructor(private readonly requestContext: RequestContextService) {}
  @Get()
  getRequestContext(@Req() req: Request) {
    const context = this.requestContext.getContext();
    return context;
  }
}
