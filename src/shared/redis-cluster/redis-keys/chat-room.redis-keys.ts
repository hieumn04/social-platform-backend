export class ChatRoomRedisKeys {
  static roomMeta(roomId: string): string {
    return `chat:room:{${roomId}}:meta`;
  }

  static roomSeq(roomId: string): string {
    return `chat:room:{${roomId}}:seq`;
  }

  /* ===================================================
   * REALTIME / PRESENCE
   * =================================================== */

  // User đang online trong room
  static roomOnline(roomId: string): string {
    return `chat:room:{${roomId}}:online`;
  }

  // User đang typing
  static roomTyping(roomId: string): string {
    return `chat:room:{${roomId}}:typing`;
  }

  /* ===================================================
   * USER INDEX
   * =================================================== */

  static userRooms(userId: string): string {
    return `chat:user:{${userId}}:rooms`;
  }

  static userLastMessageAt(userId: string, roomId: string): string {
    return `chat:user:{${userId}}:last_message_at:${roomId}`; // string timestamp
  }

  static userLastMessageId(userId: string, roomId: string): string {
    return `chat:user:{${userId}}:last_message_id:${roomId}`; // string messageId
  }

  static userLastSeenSeq(userId: string, roomId: string): string {
    return `chat:user:{${userId}}:last_room_seen_seq:${roomId}`; // string seq
  }
}
