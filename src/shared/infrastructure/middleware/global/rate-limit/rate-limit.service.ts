import { Injectable, OnModuleInit } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { RedisService } from 'src/shared/redis/redis.service';
import { RateLimitStore } from './rate-limit.store';

@Injectable()
export class RateLimitService implements OnModuleInit {
  private limiter: ReturnType<typeof rateLimit> | null = null;

  constructor(private readonly redisService: RedisService) {}

  private positiveInteger(value: string | undefined, fallback: number): number {
    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  onModuleInit() {
    const rateLimitStore = new RateLimitStore(this.redisService);
    const windowMs = this.positiveInteger(
      process.env.RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000,
    );
    const max = this.positiveInteger(
      process.env.RATE_LIMIT_MAX,
      process.env.NODE_ENV === 'production' ? 1000 : 2000,
    );

    this.limiter = rateLimit({
      store: rateLimitStore,
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_request, response, _next, options) => {
        response.status(options.statusCode).json({
          statusCode: options.statusCode,
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later.',
        });
      },
    });
  }

  getLimiter() {
    if (!this.limiter) throw new Error('Rate limiter not initialized');
    return this.limiter;
  }
}
