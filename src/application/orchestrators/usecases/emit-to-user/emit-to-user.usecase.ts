// import { EmitToUserInput } from '@/application/orchestrators/usecases/emit-to-user/emit-to-user.input';
// import { DefaultSocketRoutingService } from '@/modules/chat/application/service/default-socket-routing.service';
// import { ResolveUserSocketsUseCase } from '@/modules/chat/application/usecase/resolve-user-sockets.usecase/resolve-user-sockets.usecase';
// import { SocketIoWsEmitter } from '@/modules/chat/infrastructure/ws/socket-io-ws-emitter';
// import { NodeId } from '@/modules/value-objects/nodeId';
// import { AppLogger } from '@/shared/logger/applogger';
// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class EmitToUserUseCase {
//   constructor(
//     private readonly resolveSocketsUC: ResolveUserSocketsUseCase,
//     private readonly routingService: DefaultSocketRoutingService,
//     private readonly socketIoWsEmitter: SocketIoWsEmitter,
//     private readonly nodeId: NodeId,
//     private readonly logger: AppLogger,
//   ) {
//     this.logger.setContext(EmitToUserUseCase.name);
//   }

//   async execute(input: EmitToUserInput): Promise<void> {
//     const { receiverId, event, payload, excludeSocketIds } = input;
//     const resolved = await this.resolveSocketsUC.execute(receiverId);
//     const sockets = resolved.sockets;
//     this.logger.debug('emit to sockets', { sockets });

//     if (!sockets.length) return;

//     const socketsByNode = this.routingService.groupByNode(sockets);

//     const localSockets = socketsByNode.get(this.nodeId.getValue()) || [];
//     this.logger.debug('emit to local sockets', { localSockets });
//     for (const socket of localSockets) {
//       if (excludeSocketIds?.includes(socket.socketId)) continue;
//       this.logger.debug('emit to local socket', { socket });
//       this.socketIoWsEmitter.emit(socket.socketId, event, payload);
//     }

//     // for (const [nodeId, sockets] of socketsByNode.entries()) {

//     // }
//   }
// }
