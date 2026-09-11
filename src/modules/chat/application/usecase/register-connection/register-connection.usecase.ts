import { Injectable, Inject } from '@nestjs/common';
import { RegisterConnectionInput } from './register-connection.input';
import { ConnectionDomain } from '@/modules/chat/domain/model/connection.domain';
import { ConnectionRepository } from '@/modules/chat/domain/repositories/connection.repository';
import { SocketId } from '@/modules/value-objects/socketId';
import { NodeIdResolver } from '@/shared/node/node-id.resolver.interface';
import { NodeFlushPipelineManager } from '@/modules/chat/application/service/node-flush-pipeline-manager';
import { NodeId } from '@/modules/value-objects/nodeId';
import { NODE_ID_RESOLVER } from '@/shared/node/node-id.tokens';

@Injectable()
export class RegisterConnectionUseCase {
  constructor(
    @Inject('ConnectionRepository')
    private readonly repo: ConnectionRepository,

    @Inject(NODE_ID_RESOLVER)
    private readonly nodeIdResolver: NodeIdResolver,

    private readonly pipelineManager: NodeFlushPipelineManager<ConnectionDomain>,
  ) {}

  async execute(inputs: RegisterConnectionInput[]): Promise<void> {
    for (const input of inputs) {
      const nodeId = this.nodeIdResolver.resolve(input.nodeId);

      const buffer = this.pipelineManager.getOrCreate(
        nodeId.getValue(),
        async (items) => {
          if (!items.length) return;
          await this.repo.saveMany(items);
        },
        {
          flushIntervalMs: 250,
          maxBatchSize: 500,
        },
      );

      const domain = this.createConnectionDomain(input, nodeId.getValue());

      buffer.add(input.socketId, domain, 'RegisterConnectionUseCase');
    }
  }

  private createConnectionDomain(
    input: RegisterConnectionInput,
    nodeId: string,
  ): ConnectionDomain {
    return ConnectionDomain.create({
      userId: input.userId,
      socketId: SocketId.from(input.socketId),
      deviceId: input.deviceId,
      nodeId: NodeId.from(nodeId),
      ip: input.ip,
      connectedAt: new Date(),
    });
  }
}
