import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { getClientIp } from 'src/common/untils/request.util';
import { RequestContextService } from 'src/shared/context/request-context.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}
  use(req: Request, res: Response, next: NextFunction) {
    console.log('[Middleware] DeviceMiddleware chạy trước guard');
    const deviceId = req.deviceId;

    const context = {
      requestId: uuidv4(),
      startTime: Date.now(),
      ip: getClientIp(req),
      geo: { country: 'VN' },
      deviceId,
    };

    this.requestContext.run(context, () => {
      req.requestId = context.requestId;
      next();
    });
  }
}
