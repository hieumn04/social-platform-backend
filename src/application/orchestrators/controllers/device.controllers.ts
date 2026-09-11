import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('deviceId & auth')
@Controller()
export class DeviceController {
  @Get('deviceId/init')
  initDevice(@Req() req: Request) {
    console.log(req.deviceId);
    return {
      message: 'Device initialized',
      deviceId: req.cookies?.deviceId,
    };
  }

  @Get('auth/refresh/get-refresh-token')
  getRefreshToken(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return { message: 'No refresh token found', refreshToken: null };
    }

    return {
      message: 'Refresh token retrieved successfully',
      refreshToken,
    };
  }
}
