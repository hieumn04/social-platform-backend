import { NodeId } from '@/modules/value-objects/nodeId';

export interface RegisterConnectionInput {
  userId: string;
  socketId: string;
  ip: string;
  deviceId?: string;
  nodeId?: string;
}
