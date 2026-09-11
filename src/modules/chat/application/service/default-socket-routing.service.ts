import { SocketRoutingService } from '@/modules/chat/application/ports/socket-routing.service';
import { SocketInfo, SocketInfoWithUser } from '@/types/socket/gateway';

export class DefaultSocketRoutingService implements SocketRoutingService {
  groupByNode<T extends SocketInfo>(sockets: readonly T[]): Map<string, T[]> {
    const result = new Map<string, T[]>();

    for (const socket of sockets) {
      if (!socket.nodeId) {
        throw new Error(
          `SocketRoutingService: nodeId is required (socketId=${socket.socketId})`,
        );
      }

      const list = result.get(socket.nodeId);
      if (list) {
        list.push(socket);
      } else {
        result.set(socket.nodeId, [socket]);
      }
    }

    return result;
  }

  groupByNodeAndUser(
    sockets: readonly SocketInfoWithUser[],
  ): Map<string, Map<string, SocketInfoWithUser[]>> {
    const result = new Map<string, Map<string, SocketInfoWithUser[]>>();

    for (const socket of sockets) {
      if (!socket.nodeId) {
        throw new Error(
          `SocketRoutingService: nodeId is required (socketId=${socket.socketId})`,
        );
      }

      let userMap = result.get(socket.nodeId);
      if (!userMap) {
        userMap = new Map();
        result.set(socket.nodeId, userMap);
      }

      const socketsOfUser = userMap.get(socket.userId) ?? [];
      socketsOfUser.push(socket);
      userMap.set(socket.userId, socketsOfUser);
    }

    return result;
  }
}
