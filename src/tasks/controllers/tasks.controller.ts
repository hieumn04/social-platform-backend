import { Request } from 'express';
import { Controller, Get, Req } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  @Get()
  getTasks(@Req() req: Request) {
    const tenant = req.tenant;
    return {
      message: `List tasks for tenant: ${tenant?.name}`,
    };
  }
}
