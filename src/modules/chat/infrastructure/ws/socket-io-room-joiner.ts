import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsRoomJoiner } from '@/modules/chat/application/ports/ws-room-joiner.port';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { AppLogger } from '@/shared/logger/applogger';

@Injectable()
export class SocketIoRoomJoiner implements WsRoomJoiner {
  constructor(
    private readonly threadRepo: TypeormInboxThreadRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SocketIoRoomJoiner.name);
  }

  async joinUserRooms(userId: string, socket: Socket): Promise<void> {
    try {
      // 1. Fetch latest threads for the user
      // Instagram usually joins all active threads to catch any realtime updates.
      // We'll join the latest 50 for now.
      const threads = await this.threadRepo.getLatestThreads(userId, 50);

      if (!threads.length) {
        this.logger.debug(`User ${userId} has no active threads to join.`);
        return;
      }

      // 2. Join each thread room
      for (const thread of threads) {
        const roomId = thread.thread_fbid;
        if (roomId) {
          await socket.join(`conversation:${roomId}`);
        }
      }

      this.logger.log(`User ${userId} joined ${threads.length} rooms.`);
    } catch (err) {
      this.logger.error(`Failed to join rooms for user ${userId}`, {
        error: err,
        socketId: socket.id,
      });
    }
  }

  joinRoom(socket: Socket, roomId: string): void {
    if (!socket || !roomId) return;
    void socket.join(`conversation:${roomId}`);
    this.logger.debug(`Socket ${socket.id} joined room conversation:${roomId}`);
  }
}
