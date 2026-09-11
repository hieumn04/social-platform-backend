import { AppLogger } from '@/shared/logger/applogger';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { LastReadRedisKeys } from '@/shared/redis-cluster/redis-keys/lastRead.redis-keys';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LastReadService {
  constructor(
    private readonly redis: RedisClusterService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('LastReadService');
  }

  async setUserRoomLastRead(
    userId: string,
    roomId: string,
    lastMessageId: string,
  ) {
    const key = LastReadRedisKeys.userRoomsHash(userId);
    const field = LastReadRedisKeys.userRoomField(roomId);

    try {
      await this.redis.raw.hset(key, field, lastMessageId);

      this.logger.debug('Set lastRead single', {
        userId,
        roomId,
      });
    } catch (err) {
      this.logger.error('Failed to set lastRead single', {
        userId,
        roomId,
        error: err,
      });
      throw err;
    }
  }

  async setManyUsersRoomLastRead(
    updates: Array<{ userId: string; roomId: string; lastMessageId: string }>,
  ) {
    if (!updates.length) {
      this.logger.debug('Skip batch lastRead update: empty updates');
      return;
    }

    const pipeline = this.redis.pipeline();

    for (const { userId, roomId, lastMessageId } of updates) {
      const key = LastReadRedisKeys.userRoomsHash(userId);
      const field = LastReadRedisKeys.userRoomField(roomId);
      pipeline.hset(key, field, lastMessageId);
    }

    try {
      const results = await pipeline.exec();

      const failed = results?.filter(([err]) => err) ?? [];

      if (failed.length > 0) {
        this.logger.warn('Partial failure in batch lastRead update', {
          total: updates.length,
          failed: failed.length,
        });
      } else {
        this.logger.log('Batch lastRead update success', {
          total: updates.length,
        });
      }
    } catch (err) {
      this.logger.error('Batch lastRead update failed', {
        total: updates.length,
        error: err,
      });
      throw err;
    }
  }

  async getUserRoomLastRead(
    userIds: string[],
    roomIds?: string[],
  ): Promise<Record<string, Record<string, string>>> {
    if (!userIds.length) {
      this.logger.debug('Skip getUserRoomLastRead: empty userIds');
      return {};
    }

    const pipeline = this.redis.pipeline();

    for (const userId of userIds) {
      const key = LastReadRedisKeys.userRoomsHash(userId);

      if (!roomIds || roomIds.length === 0) {
        pipeline.hgetall(key);
      } else {
        const fields = roomIds.map((roomId) =>
          LastReadRedisKeys.userRoomField(roomId),
        );
        pipeline.hmget(key, ...fields);
      }
    }

    try {
      const results = await pipeline.exec();
      const output: Record<string, Record<string, string>> = {};

      results?.forEach(([err, res], idx) => {
        const userId = userIds[idx];

        if (err) {
          this.logger.warn('Failed to get lastRead for user', {
            userId,
            error: err,
          });
          return;
        }

        if (!roomIds || roomIds.length === 0) {
          output[userId] = res as Record<string, string>;
        } else {
          output[userId] = roomIds.reduce(
            (acc, roomId, ridx) => {
              acc[roomId] = (res as string[])[ridx] ?? null;
              return acc;
            },
            {} as Record<string, string>,
          );
        }
      });

      this.logger.debug('Get lastRead success', {
        users: userIds.length,
        rooms: roomIds?.length ?? 'ALL',
      });

      return output;
    } catch (err) {
      this.logger.error('Get lastRead failed', {
        users: userIds.length,
        rooms: roomIds?.length,
        error: err,
      });
      throw err;
    }
  }
}
