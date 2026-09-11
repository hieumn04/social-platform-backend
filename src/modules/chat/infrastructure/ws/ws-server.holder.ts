import { Server } from 'socket.io';

export class WsServerHolder {
  private static server: Server | null = null;

  static set(server: Server) {
    if (this.server) return;
    this.server = server;
  }

  static get(): Server {
    if (!this.server) {
      throw new Error('Socket.IO server has not been initialized');
    }
    return this.server;
  }

  static isReady(): boolean {
    return !!this.server;
  }
}
