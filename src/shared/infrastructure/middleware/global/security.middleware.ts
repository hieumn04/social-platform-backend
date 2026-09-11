import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import helmet, { HelmetOptions } from 'helmet';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const helmetConfig: HelmetOptions = {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
          'style-src': ["'self'", 'https://cdn.jsdelivr.net'],
          'img-src': ["'self'", 'data:', 'https://your-image-cdn.com'],
          'frame-ancestors': ["'self'"], // prevent clickjacking
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 60 * 60 * 24 * 365,
        includeSubDomains: true,
        preload: true,
      },
      dnsPrefetchControl: { allow: false },
      ieNoOpen: true,
      xssFilter: true,
      noSniff: true,
    };
    helmet(helmetConfig)(req, res, next);
  }
}
