export interface WsRoomJoiner {
  /**
   * Joins a socket to all rooms (conversations) the user belongs to.
   * This is critical for realtime broadcasting to work.
   */
  joinUserRooms(userId: string, socket: any): Promise<void>;

  /**
   * Joins a specific room (e.g. when a new thread is created).
   */
  joinRoom(socket: any, roomId: string): void;
}
