import { Injectable, Inject } from '@nestjs/common';
import { ConnectionRepository } from '@/modules/chat/domain/repositories/connection.repository';
import { NodeFlushPipelineManager } from '@/modules/chat/application/service/node-flush-pipeline-manager';
import { SocketToUnbind } from '@/types/socket/gateway';
import { chunkArray } from '@/helpers/helper';

@Injectable()
export class DisconnectConnectionUseCase {
  private readonly CHUNK_SIZE = 200;

  constructor(
    @Inject('ConnectionRepository')
    private readonly repo: ConnectionRepository,
    private readonly pipelineManager: NodeFlushPipelineManager<SocketToUnbind>,
  ) {}

  async execute(inputs: SocketToUnbind[]): Promise<void> {
    if (!inputs.length) return;

    const chunks = chunkArray(inputs, this.CHUNK_SIZE);

    for (const chunk of chunks) {
      const buffer = this.pipelineManager.getOrCreateByChunk(
        async (items: SocketToUnbind[]) => {
          if (!items.length) return;

          await this.repo.removeBySocketIds(items);
        },
        {
          flushIntervalMs: 250,
          maxBatchSize: 500,
        },
      );

      for (const item of chunk) {
        buffer.add(item.socketId, item, 'DisconnectConnectionUseCase');
      }
    }
  }
}
