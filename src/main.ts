import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalValidatePipe } from './shared/pipes/global-validation.pipe';
import { setupSwagger } from './shared/config/swagger/swagger.setup';
import cookieParser from 'cookie-parser';
import { AppLogger } from '@/shared/logger/applogger';
import { NestConfigService } from '@/shared/config/config.service';
import { SocketIoAdapter } from '@/modules/chat/infrastructure/ws/socket-io.adapter';
import { WsServerHolder } from '@/modules/chat/infrastructure/ws/ws-server.holder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
  });

  const config = app.get(NestConfigService);
  const logger = await app.resolve(AppLogger);

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:8000'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(GlobalValidatePipe);

  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  const socketAdapter = new SocketIoAdapter(app, logger, config);
  app.useWebSocketAdapter(socketAdapter);

  logger.log('SocketIoAdapter initialized');

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port);

  logger.log(`Application running on port ${port}`);

  if (WsServerHolder.isReady()) {
    logger.log('Socket.IO server is ready (registered in WsServerHolder)');
  }
}

bootstrap();
