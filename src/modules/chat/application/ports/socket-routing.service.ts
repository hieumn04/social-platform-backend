import { SocketInfo, SocketInfoWithUser } from '@/types/socket/gateway';

export interface SocketRoutingService {
  groupByNode(sockets: SocketInfo[]): Map<string, SocketInfo[]>;
  groupByNodeAndUser(
    sockets: readonly SocketInfoWithUser[],
  ): Map<string, Map<string, SocketInfoWithUser[]>>;
}
