import { Injectable, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly rateLimitService: RateLimitService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const limiter = this.rateLimitService.getLimiter();
    return limiter(req, res, next);
  }
}
