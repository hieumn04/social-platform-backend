import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestContextMiddleware } from './global/request-context.middleware';
import { SecurityMiddleware } from './global/security.middleware';

import { DeviceMiddleware } from './global/device-middleware/device.middleware';
import { HttpLoggerMiddleware } from 'src/shared/logger/http-logger.middleware';
import { RequestContextModule } from 'src/shared/context/request-context-service.module';
import { DeviceIdMiddleware } from './global/device-middleware/deviceId.middle';
import { RateLimitMiddleware } from './global/rate-limit/rate-limit.middleware';
import { RateLimitModule } from './global/rate-limit/rate-limit.module';

@Module({
  imports: [RequestContextModule, RateLimitModule],
})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestContextMiddleware,
        SecurityMiddleware,
        RateLimitMiddleware,
        DeviceMiddleware,
        DeviceIdMiddleware,
        HttpLoggerMiddleware,
      )
      .forRoutes('*');
  }
}
