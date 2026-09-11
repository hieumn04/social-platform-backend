export interface WsEmitter {
  emit(socketId: string, event: string, payload: unknown): void;

  emitToRoom(roomId: string, event: string, payload: unknown): void;
}
