import { NodeId } from '@/modules/value-objects/nodeId';
import { SocketId } from '@/modules/value-objects/socketId';

export interface WsConfig {
  path: string;
  namespace: string;
  corsOrigins: string[];
  pingInterval: number;
  pingTimeout: number;
}

export interface ConnectionProps {
  userId: string;
  socketId: SocketId;
  nodeId: NodeId;
  connectedAt: Date;
  ip?: string;
  deviceId?: string;
}

export interface SocketInfo {
  socketId: string;
  nodeId?: string;
}

export interface SocketInfoWithUser extends SocketInfo {
  userId: string;
}

export interface SocketToUnbind {
  socketId: string;
  userId: string;
}

export interface BindSocketPayload {
  socketId: string;
  userId: string;
  nodeId: string;
  deviceId?: string;
  ip?: string;
}
