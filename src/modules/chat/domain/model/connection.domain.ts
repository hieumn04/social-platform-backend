import { NodeId } from '@/modules/value-objects/nodeId';
import { SocketId } from '@/modules/value-objects/socketId';
import { ConnectionProps } from '@/types/socket/gateway';

export class ConnectionDomain {
  private constructor(private readonly props: ConnectionProps) {}

  static create(props: ConnectionProps): ConnectionDomain {
    if (!props) {
      throw new Error('ConnectionProps is required');
    }
    if (!props.socketId || !props.nodeId || !props.userId) {
      throw new Error('socketId, nodeId, and userId are required');
    }

    if (!props.connectedAt) {
      props.connectedAt = new Date();
    }

    return new ConnectionDomain(props);
  }

  get socketId(): SocketId {
    return this.props.socketId;
  }

  get nodeId(): NodeId {
    return this.props.nodeId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get deviceId(): string | null {
    return this.props.deviceId ?? null;
  }

  get ip(): string | null {
    return this.props.ip ?? null;
  }

  get connectedAt(): Date {
    return this.props.connectedAt;
  }

  toPrimitives() {
    return {
      userId: this.userId,
      socketId: this.socketId.getValue(),
      nodeId: this.nodeId.getValue(),
      deviceId: this.deviceId,
      ip: this.ip,
      connectedAt: this.connectedAt.toISOString(),
    };
  }
}
