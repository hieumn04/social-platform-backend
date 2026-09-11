// chat-gateway.redis.ts
import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

import { Injectable } from '@nestjs/common';
import { NestConfigService } from '@/shared/config/config.service';

@WebSocketGateway()
@Injectable()
export class ChatGatewayRedis implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(private readonly config: NestConfigService) {}

  async afterInit(server: Server) {
    const pubClient = createClient({ url: this.config.redis.host });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    server.adapter(createAdapter(pubClient, subClient));

    console.log('Redis adapter initialized for multi-node WebSocket');
  }
}
