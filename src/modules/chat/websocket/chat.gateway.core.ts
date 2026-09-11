import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import { AppLogger } from '@/shared/logger/applogger';
import { NestConfigService } from '@/shared/config/config.service';
import { ChatGatewayOptions } from './chat-gateway.config';

@WebSocketGateway()
@Injectable()
export class ChatGatewayCore
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private userSockets = new Map<string, string>();

  constructor(
    private readonly config: NestConfigService,
    private readonly logger: AppLogger,

    @Inject('CHAT_GATEWAY_OPTIONS')
    private readonly opts: ChatGatewayOptions,
  ) {
    this.logger.setContext(ChatGatewayCore.name);
  }

  /**
   * Apply runtime config (namespace, cors)
   */
  afterInit(server: Server) {
    // Apply CORS dynamically
    server._opts.cors = this.opts.cors;

    // Create namespace
    server.of(this.opts.namespace);

    this.logger.log(
      `ChatGateway initialized → namespace=${this.opts.namespace}, cors=${this.opts.cors.origin}`,
    );
  }

  /**
   * Client connect
   */
  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload: any = jwt.verify(token, this.config.socket.jwtSecret);

      const userId = payload.sub;
      if (!userId) throw new Error('Invalid token payload');

      // Store local
      this.userSockets.set(userId, client.id);

      // Join room for multi-device & multi-node
      client.join(userId);
      client.data.userId = userId;

      this.logger.log(`User connected → userId=${userId}, socket=${client.id}`);
    } catch (err) {
      this.logger.error(`Auth failed`, {
        error: err,
      });
      client.disconnect();
    }
  }

  /**
   * Client disconnect
   */
  handleDisconnect(client: Socket) {
    const userId =
      client.data?.userId ||
      [...this.userSockets.entries()].find(
        ([_, sid]) => sid === client.id,
      )?.[0];

    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`User disconnected → userId=${userId}`);
    } else {
      this.logger.log(`Socket disconnected → ${client.id}`);
    }
  }
}
