import { WsEmitter } from '@/modules/chat/application/ports/ws-emitter';
import { WsServerHolder } from '@/modules/chat/infrastructure/ws/ws-server.holder';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketIoWsEmitter implements WsEmitter {
  emit(socketId: string | undefined, event: string, payload: unknown): void {
    if (!socketId) return;

    const server = WsServerHolder.get();

    server.to(socketId).emit(event, payload);
  }

  emitToRoom(roomId: string, event: string, payload: unknown): void {
    const server = WsServerHolder.get();
    server.to(roomId).emit(event, payload);
  }
}
