import { ConnectionDomain } from '@/modules/chat/domain/model/connection.domain';
import { SocketId } from '@/modules/value-objects/socketId';
import {
  BindSocketPayload,
  SocketInfoWithUser,
  SocketToUnbind,
} from '@/types/socket/gateway';

export interface ConnectionRepository {
  save(connection: ConnectionDomain): Promise<void>;
  saveMany(connections: ConnectionDomain[]): Promise<void>;

  removeBySocketIds(sockets: SocketToUnbind[]): Promise<void>;

  refreshSocketsTTL(
    params: Array<{
      userId: string;
      socketId: SocketId | string;
      nodeId: string;
    }>,
  ): Promise<void>;

  heartbeatNode(nodeId: string): Promise<void>;
  checkNodeStatus(nodeId: string): Promise<boolean>;
}
