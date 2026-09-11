// import { Injectable } from '@nestjs/common';

// import { ConnectionDomain } from '@/modules/chat/domain/model/connection.domain';
// import { ConnectionRepository } from '@/modules/chat/domain/repositories/connection.repository';

// import { SocketId } from '@/modules/value-objects/socketId';
// import { AppLogger } from '@/shared/logger/applogger';

// import {
//   BindSocketPayload,
//   SocketInfo,
//   SocketInfoWithUser,
//   SocketToUnbind,
// } from '@/types/socket/gateway';

// import { FlushService } from '@/shared/flush/flush.service';

// @Injectable()
// export class RedisClusterConnectionRepository implements ConnectionRepository {
//   constructor(
//     private readonly redis: WsSocketRedisService,
//     private readonly logger: AppLogger,
//   ) {
//     this.logger.setContext(RedisClusterConnectionRepository.name);
//   }

//   async save(connection: ConnectionDomain): Promise<void> {
//     await this.saveMany([connection]);
//   }

//   async saveMany(connections: ConnectionDomain[]): Promise<void> {
//     if (!connections.length) return;

//     await this.redis.bindSockets(
//       connections.map((c) => ({
//         userId: c.userId,
//         socketId: c.socketId.getValue(),
//         nodeId: c.nodeId.getValue(),
//         deviceId: c.deviceId ?? '',
//         ip: c.ip ?? '',
//       })),
//     );

//     this.logger.debug('WS connections saved (batch)', {
//       count: connections.length,
//       users: new Set(connections.map((c) => c.userId)).size,
//     });
//   }

//   async removeBySocketIds(sockets: SocketToUnbind[]): Promise<void> {
//     if (!sockets.length) return;

//     await this.redis.unbindSockets(sockets);

//     this.logger.log('WS connections removed', {
//       count: sockets.length,
//     });
//   }

//   async refreshSocketsTTL(
//     params: Array<{
//       userId: string;
//       socketId: SocketId | string;
//       nodeId: string;
//     }>,
//   ): Promise<void> {
//     if (!params.length) return;

//     await this.redis.refreshSocketsTTL(
//       params.map((p) => ({
//         userId: p.userId,
//         socketId:
//           typeof p.socketId === 'string' ? p.socketId : p.socketId.getValue(),
//         nodeId: p.nodeId,
//       })),
//     );
//   }

//   async heartbeatNode(nodeId: string): Promise<void> {
//     await this.redis.heartbeatNode(nodeId);
//   }

//   async checkNodeStatus(nodeId: string): Promise<boolean> {
//     return this.redis.isNodeAlive(nodeId);
//   }
// }
