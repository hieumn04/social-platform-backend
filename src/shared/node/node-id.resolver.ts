import { Injectable } from '@nestjs/common';
import { NodeId } from '@/modules/value-objects/nodeId';
import { NodeIdResolver } from './node-id.resolver.interface';
import { AppLogger } from '@/shared/logger/applogger';

@Injectable()
export class DefaultNodeIdResolver implements NodeIdResolver {
  constructor(
    private readonly currentNodeId: NodeId,
    private readonly logger: AppLogger,
  ) {
    this.logger.log('DefaultNodeIdResolver');
  }

  resolve(explicitNodeId?: string): NodeId {
    this.logger.log(`AAAA${explicitNodeId}`);
    if (explicitNodeId && explicitNodeId.trim() !== '') {
      return NodeId.from(explicitNodeId);
    }
    this.logger.log(`BBBB${this.currentNodeId.getValue()}`);

    return this.currentNodeId;
  }
}
