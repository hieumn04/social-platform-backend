import { AppLogger } from '@/shared/logger/applogger';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { ChatRoomRedisKeys } from '@/shared/redis-cluster/redis-keys/chat-room.redis-keys';
import { AddRoomsParams, RoomData } from '@/types/typeModel/chat-room';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WsRoomRedisService {
  constructor(
    private readonly redis: RedisClusterService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('WsRoomRedisService');
  }

  async addUsersToRooms(rooms: AddRoomsParams): Promise<void> {
    if (!rooms || Object.keys(rooms).length === 0) return;

    const roomIds = Object.keys(rooms);

    // ===== Room-level pipelines =====
    const roomPromises = roomIds.map(async (roomId) => {
      const roomData: RoomData = rooms[roomId];

      try {
        const roomPipeline = this.redis.pipeline();

        // --- meta
        if (roomData.meta) {
          const key = ChatRoomRedisKeys.roomMeta(roomId);
          const hash: Record<string, string> = {};
          Object.entries(roomData.meta).forEach(([k, v]) => {
            if (v != null) hash[k] = String(v);
          });
          if (Object.keys(hash).length) {
            roomPipeline.hset(key, hash);
          }
        }

        // --- seq / lastMessage
        if (roomData.realtime) {
          const keySeq = ChatRoomRedisKeys.roomSeq(roomId);
          roomPipeline.hset(keySeq, {
            seq: String(roomData.realtime.roomSeq),
            lastMessageId: roomData.realtime.lastMessageId || '',
            lastMessageAt: roomData.realtime.lastMessageAt || '',
          });
        }

        await roomPipeline.exec();
      } catch (err) {
        this.logger.error(`Error saving room ${roomId}`, {
          error: err,
        });
      }

      // ===== User-level pipelines for this room =====
      if (roomData.usersRealtime && roomData.usersRealtime.length > 0) {
        const userPromises = roomData.usersRealtime.map(async (user) => {
          try {
            const userPipeline = this.redis.pipeline();

            // lastMessageAt
            if (roomData.realtime?.lastMessageAt) {
              const key = ChatRoomRedisKeys.userLastMessageAt(
                user.userId,
                roomId,
              );
              userPipeline.set(key, roomData.realtime.lastMessageAt);
            }

            // lastMessageId
            if (roomData.realtime?.lastMessageId) {
              const key = ChatRoomRedisKeys.userLastMessageId(
                user.userId,
                roomId,
              );
              userPipeline.set(key, roomData.realtime.lastMessageId);
            }

            // lastSeenSeq
            const keySeen = ChatRoomRedisKeys.userLastSeenSeq(
              user.userId,
              roomId,
            );
            userPipeline.set(keySeen, String(user.lastSeenSeq));

            await userPipeline.exec();
          } catch (err) {
            this.logger.error(
              `Error saving user ${user.userId} in room ${roomId}`,
              {
                error: err,
              },
            );
          }
        });

        await Promise.all(userPromises);
      }
    });

    await Promise.all(roomPromises);

    this.logger.log('Rooms updated', {
      rooms: roomIds.length,
    });
  }
}
