import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('test-device')
@Controller('test-device')
export class TestDeviceController {
  @Get()
  getDevice(@Req() req: Request) {
    console.log(req.deviceInfo);
    return req.deviceInfo;
  }
}
