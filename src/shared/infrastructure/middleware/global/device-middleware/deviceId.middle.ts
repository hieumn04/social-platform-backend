import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class DeviceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let deviceId =
      (req.headers['x-device-id'] as string) || req.cookies?.deviceId;
    if (!deviceId) {
      deviceId = uuidv4();
      res.cookie('deviceId', deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });
    }
    req.deviceId = deviceId;
    next();
  }
}
