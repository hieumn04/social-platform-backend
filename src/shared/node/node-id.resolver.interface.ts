import { NodeId } from '@/modules/value-objects/nodeId';

export interface NodeIdResolver {
  resolve(explicitNodeId?: string): NodeId;
}
