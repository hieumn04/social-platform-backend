import { AppLogger } from '@/shared/logger/applogger';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { STATUS_CODES } from 'http';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    const deviceId = req['deviceId'] || 'unknown';
    const requestId = req['requestId'] || 'unknown';

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const statusCode = res.statusCode;
      const statusMessage = STATUS_CODES[statusCode] || 'Unknown';

      this.logger.http(`${method} ${originalUrl}`, {
        method,
        url: originalUrl,
        statusCode,
        statusMessage,
        durationMs,
        ip,
        userAgent,
        requestId,
        deviceId,
        timestamp: new Date().toISOString(),
      });
    });

    next();
  }
}
