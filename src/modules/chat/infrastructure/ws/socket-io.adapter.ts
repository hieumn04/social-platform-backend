import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { Server, ServerOptions, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

import { AppLogger } from '@/shared/logger/applogger';
import { NestConfigService } from '@/shared/config/config.service';
import { WsServerHolder } from '@/modules/chat/infrastructure/ws/ws-server.holder';

export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly logger: AppLogger,
    private readonly config: NestConfigService,
  ) {
    super(app);
    this.logger.setContext(SocketIoAdapter.name);
  }

  createIOServer(port: number, options?: Partial<ServerOptions>): Server {
    const server = super.createIOServer(port, {
      path: this.config.socket.path,
      cors: {
        origin: this.config.socket.corsOrigins,
        credentials: true,
      },
      pingInterval: this.config.socket.pingInterval,
      pingTimeout: this.config.socket.pingTimeout,
      serveClient: false,
      ...options,
    });

    this.logger.log(`Socket.IO server created on port ${port}`);

    this.setupAuthMiddleware(server);
    this.setupConnectionLogging(server);

    WsServerHolder.set(server);

    return server;
  }

  private setupAuthMiddleware(server: Server) {
    server.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          return next(new Error('Authentication token missing'));
        }

        const payload = jwt.verify(token, this.config.jwt.accessTokenSecret);

        socket.data.user = payload;
        next();
      } catch (err) {
        this.logger.warn('Socket auth failed', {
          socketId: socket.id,
          error: (err as Error).message,
        });
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupConnectionLogging(server: Server) {
    server.on('connection', (socket: Socket) => {
      this.logger.log(`WS connected socket=${socket.id}`);

      socket.on('disconnect', (reason) => {
        this.logger.log(`WS disconnected socket=${socket.id} reason=${reason}`);
      });
    });
  }
}
