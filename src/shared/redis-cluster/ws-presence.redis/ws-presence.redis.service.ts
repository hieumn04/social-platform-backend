// import { Injectable } from '@nestjs/common';
// import { AppLogger } from '@/shared/logger/applogger';
// import { BindSocketPayload, SocketToUnbind } from '@/types/socket/gateway';
// import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
// import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';
// import { groupByKey } from '@/helpers/cluster-group.helper';
// import { chunkArray } from '@/helpers/helper';

// @Injectable()
// export class WsSocketRedisService {
//   constructor(
//     private readonly redis: RedisClusterService,
//     private readonly logger: AppLogger,
//   ) {
//     this.logger.setContext('WsSocketRedisService');
//   }

//   async bindSocket(payload: BindSocketPayload): Promise<void> {
//     return this.bindSockets([payload]);
//   }

//   async unbindSocket(payload: BindSocketPayload): Promise<void> {
//     return this.unbindSockets([payload]);
//   }

//   async bindSockets(payloads: BindSocketPayload[]): Promise<void> {
//     if (!payloads.length) return;

//     const ttlSocket = this.redis.getWsConnectionTTL();
//     const ttlPresence = this.redis.getWsPresenceTTL();
//     const now = Date.now().toString();

//     const payloadsByNode = groupByKey(payloads, (p) => p.nodeId);
//     const payloadsByUser = groupByKey(payloads, (p) => p.userId);

//     await Promise.all(
//       Array.from(payloadsByNode.entries()).map(
//         async ([nodeId, nodePayloads]) => {
//           const pipeline = this.redis.pipeline();
//           const nodeSocketsKey = WsRedisKeys.nodeSockets(nodeId);

//           for (const p of nodePayloads) {
//             const socketKey = WsRedisKeys.socket(p.nodeId, p.socketId);
//             pipeline
//               .hset(socketKey, {
//                 socketId: p.socketId,
//                 userId: p.userId,
//                 nodeId: p.nodeId,
//                 deviceId: p.deviceId ?? '',
//                 ip: p.ip ?? '',
//                 connectedAt: now,
//               })
//               .expire(socketKey, ttlSocket)
//               .sadd(nodeSocketsKey, p.socketId);
//           }

//           pipeline.expire(nodeSocketsKey, ttlPresence);

//           try {
//             await pipeline.exec();
//           } catch (err) {
//             this.logger.error(`Error saving node ${nodeId} sockets`, {
//               error: err,
//             });
//           }
//         },
//       ),
//     );

//     const indexPipeline = this.redis.pipeline();
//     for (const p of payloads) {
//       indexPipeline.set(WsRedisKeys.socketNode(p.socketId), p.nodeId);
//     }

//     try {
//       await indexPipeline.exec();
//     } catch (err) {
//       this.logger.error('Error saving socket index', {
//         error: err,
//       });
//     }

//     await Promise.all(
//       Array.from(payloadsByUser.entries()).map(
//         async ([userId, userPayloads]) => {
//           const pipeline = this.redis.pipeline();
//           const userSocketsKey = WsRedisKeys.userSockets(userId);

//           pipeline.sadd(userSocketsKey, ...userPayloads.map((p) => p.socketId));
//           pipeline.expire(userSocketsKey, ttlPresence);

//           try {
//             await pipeline.exec();
//           } catch (err) {
//             this.logger.error(`Error saving user ${userId} sockets`, {
//               error: err,
//             });
//           }
//         },
//       ),
//     );

//     this.logger.log('Sockets bound', {
//       sockets: payloads.length,
//       users: payloadsByUser.size,
//       nodes: payloadsByNode.size,
//     });
//   }

//   async unbindSockets(sockets: SocketToUnbind[]): Promise<void> {
//     if (!sockets.length) return;

//     const metas = await this.batchGetSocketMeta(sockets);
//     const now = new Date().toLocaleString('vi-VN', {
//       timeZone: 'Asia/Ho_Chi_Minh',
//     });

//     const metasByNode = groupByKey(
//       metas.filter((m) => m.nodeId),
//       (m) => m.nodeId!,
//     );

//     await Promise.all(
//       Array.from(metasByNode.entries()).map(async ([nodeId, nodeSockets]) => {
//         const pipeline = this.redis.pipeline();
//         const nodeSocketsKey = WsRedisKeys.nodeSockets(nodeId);

//         for (const s of nodeSockets) {
//           const socketKey = WsRedisKeys.socket(nodeId, s.socketId);
//           pipeline.del(socketKey);
//           pipeline.srem(nodeSocketsKey, s.socketId);
//         }

//         try {
//           await pipeline.exec();
//         } catch (err) {
//           this.logger.error(`Error unbinding sockets for node ${nodeId}`, {
//             error: err,
//           });
//         }
//       }),
//     );

//     const socketNodePipeline = this.redis.pipeline();
//     for (const s of metas) {
//       const key = WsRedisKeys.socketNode(s.socketId);
//       socketNodePipeline.del(key);
//     }

//     try {
//       await socketNodePipeline.exec();
//     } catch (err) {
//       this.logger.error('Error deleting socket index keys', {
//         error: err,
//       });
//     }

//     const metasByUser = groupByKey(metas, (m) => m.userId);
//     const luaScript = `
//     redis.call('SREM', KEYS[1], unpack(ARGV, 1, #ARGV-1))
//     local count = redis.call('SCARD', KEYS[1])
//     if count == 0 then
//       redis.call('SET', KEYS[2], ARGV[#ARGV])
//     end
//     return count
//   `;

//     await Promise.all(
//       Array.from(metasByUser.entries()).map(async ([userId, userSockets]) => {
//         const userSocketsKey = WsRedisKeys.userSockets(userId);
//         const userLastActiveKey = WsRedisKeys.userLastActive(userId);

//         try {
//           await this.redis.raw.eval(
//             luaScript,
//             2,
//             userSocketsKey,
//             userLastActiveKey,
//             ...userSockets.map((s) => s.socketId),
//             now,
//           );
//         } catch (err) {
//           this.logger.error(`Error unbinding sockets for user ${userId}`, {
//             error: err,
//           });
//         }
//       }),
//     );

//     this.logger.log('Sockets unbound', {
//       sockets: sockets.length,
//       users: metasByUser.size,
//       nodes: metasByNode.size,
//     });
//   }

//   async getUserSockets(userId: string): Promise<string[]> {
//     return this.redis.raw.smembers(WsRedisKeys.userSockets(userId));
//   }

//   // async resolveUserSockets(userId: string): Promise<SocketInfo[]> {
//   //   return this.resolveUsersSockets([userId]);
//   // }

//   // async resolveUsersSockets(userIds: string[]): Promise<SocketInfoWithUser[]> {
//   //   if (!userIds.length) return [];

//   //   const pipeline = this.redis.pipeline();
//   //   userIds.forEach((userId) =>
//   //     pipeline.smembers(WsRedisKeys.userSockets(userId)),
//   //   );

//   //   const results = await pipeline.exec();
//   //   const socketIds = (results ?? []).flatMap(
//   //     (r) => (r?.[1] as string[]) ?? [],
//   //   );

//   //   return this.resolveSocketInfos(socketIds);
//   // }

//   // private async resolveSocketInfos(
//   //   socketIds: string[],
//   // ): Promise<SocketInfoWithUser[]> {
//   //   if (!socketIds.length) return [];

//   //   const pipeline = this.redis.pipeline();
//   //   socketIds.forEach((id) =>
//   //     pipeline.hmget(WsRedisKeys.socket(id), 'userId', 'nodeId'),
//   //   );
//   //   const results = await pipeline.exec();

//   //   const resolved: SocketInfoWithUser[] = [];
//   //   socketIds.forEach((socketId, idx) => {
//   //     const [userId, nodeId] =
//   //       (results?.[idx]?.[1] as [string, string] | undefined) ?? [];
//   //     this.logger.debug('resolveSocketInfos', { socketId, userId, nodeId });
//   //     if (!userId || !nodeId) return;
//   //     resolved.push({ userId, socketId, nodeId });
//   //   });

//   //   return resolved;
//   // }

//   async heartbeatNode(nodeId: string): Promise<void> {
//     await this.redis.raw.set(
//       WsRedisKeys.nodeHeartbeat(nodeId),
//       '1',
//       'EX',
//       this.redis.getNodeHeartbeatTTL(),
//     );
//   }

//   async isNodeAlive(nodeId: string): Promise<boolean> {
//     const alive =
//       (await this.redis.raw.exists(WsRedisKeys.nodeHeartbeat(nodeId))) === 1;
//     return alive;
//   }

//   // async cleanupNode(nodeId: string): Promise<void> {
//   //   const batchSize = 1000;
//   //   let cursor = '0';
//   //   do {
//   //     const [newCursor, keys] = await this.redis.raw.sscan(
//   //       WsRedisKeys.nodeSockets(nodeId),
//   //       cursor,
//   //       'COUNT',
//   //       batchSize,
//   //     );
//   //     cursor = newCursor;
//   //     if (keys.length) {
//   //       await this.unbindSockets(keys);
//   //     }
//   //   } while (cursor !== '0');

//   //   await this.redis.raw.del(WsRedisKeys.nodeHeartbeat(nodeId));
//   // }

//   async batchGetSocketMeta(
//     sockets: SocketToUnbind[],
//   ): Promise<(SocketToUnbind & { nodeId?: string })[]> {
//     if (!sockets.length) return [];

//     const results: (SocketToUnbind & { nodeId?: string })[] = [];

//     const chunks = chunkArray(sockets, 250);

//     for (const chunk of chunks) {
//       const pipeline = this.redis.pipeline();
//       chunk.forEach((s) => pipeline.get(WsRedisKeys.socketNode(s.socketId)));
//       const execResults = await pipeline.exec();

//       chunk.forEach((s, idx) => {
//         const [err, nodeId] = execResults?.[idx] ?? [];
//         if (err)
//           this.logger.warn(`Failed to get nodeId for socket ${s.socketId}`, {
//             error: err,
//           });
//         results.push({ ...s, nodeId: nodeId ? String(nodeId) : undefined });
//       });
//     }

//     return results;
//   }

//   private async batchGetUserSocketCounts(
//     userIds: string[],
//   ): Promise<Map<string, number>> {
//     if (!userIds.length) return new Map();
//     const pipeline = this.redis.pipeline();
//     for (const userId of userIds) {
//       pipeline.get(WsRedisKeys.userSocketCount(userId));
//     }

//     const results = await pipeline.exec();
//     const map = new Map<string, number>();
//     userIds.forEach((userId, idx) => {
//       map.set(userId, Number(results?.[idx]?.[1] ?? 0));
//     });
//     return map;
//   }

//   async refreshSocketTTL(params: {
//     userId: string;
//     socketId: string;
//     nodeId: string;
//     ttl?: number;
//   }): Promise<void> {
//     const {
//       userId,
//       socketId,
//       nodeId,
//       ttl = this.redis.getWsConnectionTTL(),
//     } = params;

//     this.logger.debug('refreshSocketTTL', {
//       socketId,
//       userId,
//       nodeId,
//     });

//     await this.redis.raw
//       .pipeline()

//       .expire(WsRedisKeys.userSockets(userId), this.redis.getWsPresenceTTL())
//       .expire(WsRedisKeys.nodeSockets(nodeId), ttl)
//       .exec();
//   }

//   async refreshSocketsTTL(
//     params: Array<{
//       userId: string;
//       socketId: string;
//       nodeId: string;
//     }>,
//   ): Promise<void> {
//     if (!params.length) return;

//     const socketTTL = this.redis.getWsSocketMetaTTL();
//     const presenceTTL = this.redis.getWsPresenceTTL();
//     const nodeTTL = this.redis.getWsConnectionTTL();

//     const socketIds = new Set<string>();
//     const userIds = new Set<string>();
//     const nodeIds = new Set<string>();

//     for (const p of params) {
//       socketIds.add(p.socketId);
//       userIds.add(p.userId);
//       nodeIds.add(p.nodeId);
//     }

//     this.logger.debug('refreshSocketsTTL', {
//       sockets: socketIds.size,
//       users: userIds.size,
//       nodes: nodeIds.size,
//     });

//     const pipeline = this.redis.raw.pipeline();

//     userIds.forEach((userId) => {
//       pipeline.expire(WsRedisKeys.userSockets(userId), presenceTTL);
//     });

//     nodeIds.forEach((nodeId) => {
//       pipeline.expire(WsRedisKeys.nodeSockets(nodeId), nodeTTL);
//     });

//     await pipeline.exec();
//   }
// }
