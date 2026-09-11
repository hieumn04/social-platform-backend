import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { parse } from 'express-useragent';

import { UserAgentResult } from 'src/types/express';

@Injectable()
export class DeviceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const rawUserAgent = req.headers['user-agent'] || '';
    const ua = parse(rawUserAgent);

    let deviceType = 'Unknown';
    if (ua.isMobile) deviceType = 'Mobile';
    else if (ua.isTablet) deviceType = 'Tablet';
    else if (ua.isDesktop) deviceType = 'Desktop';
    else if (ua.isBot) deviceType = 'Bot';

    const deviceInfo: UserAgentResult = {
      rawUserAgent,
      platform: ua.platform,
      os: ua.os,
      browser: ua.browser,
      version: ua.version,
      deviceType,
    };

    req.deviceInfo = deviceInfo;
    next();
  }
}

// @Get()
// someHandler(@Req() req: Request) {
//   console.log(req.deviceInfo?.platform); // iOS, Android, Windows, etc.
// }
