export class LastReadRedisKeys {
  static userRoomsHash(userId: string) {
    return `user:${userId}:roomsLastRead`;
  }

  static userRoomField(roomId: string) {
    return roomId;
  }
}
