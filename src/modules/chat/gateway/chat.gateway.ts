import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsePipes, ValidationPipe } from '@nestjs/common';

import { AppLogger } from '@/shared/logger/applogger';
import { ConversationParticipantRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant.repository';
import { TypingWsDto } from '@/modules/chat/presentation/dto/request/typing.ws.dto';
import { PresenceService } from '@/shared/redis-cluster/presence/presence.service';

@WebSocketGateway({
  pingInterval: 25000,
  pingTimeout: 60000,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly logger: AppLogger,
    private readonly participantRepo: ConversationParticipantRepository,
    private readonly presenceService: PresenceService,
  ) {
    this.logger.setContext(ChatGateway.name);
  }

  // ─── Connection ─────────────────────────────────────────────────────────────

  async handleConnection(socket: Socket) {
    try {
      const userId = socket.data.user?.sub;

      if (!userId) {
        socket.disconnect(true);
        return;
      }

      // Join user's private room (all devices share this room)
      socket.join(`user:${userId}`);

      // Register in presence system
      const { becameOnline, activeConnectionCount } = await this.presenceService.connect(
        userId,
        socket.id,
      );

      this.logger.log(
        `WS connected user=${userId} socket=${socket.id} connections=${activeConnectionCount}`,
      );

      // Emit presence:online only on the very first connection (offline → online)
      if (becameOnline) {
        const peerUserIds =
          await this.participantRepo.getPeerUserIdsForUser(userId);

        socket.to(`user:${userId}`).emit('presence:online', { userId });

        for (const peerUserId of peerUserIds) {
          this.server.to(`user:${peerUserId}`).emit('presence:online', { userId });
        }

        this.logger.log(`presence:online emitted user=${userId}`);
      }
    } catch (err) {
      this.logger.error('WS connect error', { error: err });
      socket.disconnect(true);
    }
  }

  // ─── Disconnection ──────────────────────────────────────────────────────────

  async handleDisconnect(socket: Socket) {
    try {
      const userId = socket.data.user?.sub;
      if (!userId) return;

      // Update presence system — must happen before Socket.IO removes the socket
      const { becameOffline } = await this.presenceService.disconnect(userId, socket.id);

      this.logger.log(`WS disconnected user=${userId} socket=${socket.id}`);

      if (becameOffline) {
        // Get the lastActiveAt that the disconnect script just wrote
        const presence = await this.presenceService.getPresence(userId);
        const peerUserIds =
          await this.participantRepo.getPeerUserIdsForUser(userId);

        socket.to(`user:${userId}`).emit('presence:offline', {
          userId,
          lastActiveAt: presence.lastActiveAt,
        });

        for (const peerUserId of peerUserIds) {
          this.server.to(`user:${peerUserId}`).emit('presence:offline', {
            userId,
            lastActiveAt: presence.lastActiveAt,
          });
        }

        this.logger.log(`presence:offline emitted user=${userId}`);
      }
    } catch (err) {
      this.logger.error('WS disconnect error', { error: err });
    }
  }

  // ─── Heartbeat ──────────────────────────────────────────────────────────────

  @SubscribeMessage('presence:heartbeat')
  async handlePresenceHeartbeat(@ConnectedSocket() socket: Socket) {
    try {
      const userId = socket.data.user?.sub;
      if (!userId) return;

      await this.presenceService.heartbeat(userId, socket.id);
      this.logger.debug(`presence:heartbeat user=${userId} socket=${socket.id}`);
    } catch (err) {
      this.logger.error(`WS presence:heartbeat error socket=${socket.id}`, { error: err });
    }
  }

  // ─── Typing ─────────────────────────────────────────────────────────────────

  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: TypingWsDto,
  ) {
    try {
      const senderId = socket.data.user?.sub;
      if (!senderId) {
        this.logger.warn(`WS typing unauthorized socket=${socket.id}`);
        return;
      }

      const { conversationId, isTyping } = data;

      // 1. Verify sender is an active participant
      const participants = await this.participantRepo.getParticipantsByConversationId(conversationId);
      const isParticipant = participants.some((p) => p.user_id === senderId);

      if (!isParticipant) {
        this.logger.warn(
          `WS typing user=${senderId} is not an active participant in conversation=${conversationId}`,
        );
        return;
      }

      // 2. Broadcast to other participants' private rooms
      const otherParticipants = participants.filter((p) => p.user_id !== senderId);

      for (const p of otherParticipants) {
        this.server.to(`user:${p.user_id}`).emit('typing', {
          conversationId,
          userId: senderId,
          isTyping,
        });
      }
    } catch (err) {
      this.logger.error(`WS typing error socket=${socket.id}`, { error: err });
    }
  }
}
