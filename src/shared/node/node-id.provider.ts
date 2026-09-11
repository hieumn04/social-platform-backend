import { Provider } from '@nestjs/common';
import { NodeId } from '@/modules/value-objects/nodeId';
import os from 'os';
import { ConfigService } from '@nestjs/config';

export const NodeIdProvider: Provider = {
  provide: NodeId,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const nodeId = configService.get<string>('NODE_ID');

    if (nodeId) {
      return NodeId.from(nodeId);
    }

    return NodeId.from(`${os.hostname()}-${process.pid}`);
  },
};
