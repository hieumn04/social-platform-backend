import { Injectable, Inject } from '@nestjs/common';
import { ConnectionRepository } from '@/modules/chat/domain/repositories/connection.repository';
import { NodeId } from '@/modules/value-objects/nodeId';
import { FlushService } from '@/shared/flush/flush.service';
import { FlushBuffer } from '@/shared/flush/flush-buffer';
import { SocketInfoWithUser } from '@/types/socket/gateway';

@Injectable()
export class RefreshConnectionTTLUseCase {
  private readonly flushBuffer: FlushBuffer<SocketInfoWithUser>;

  constructor(
    @Inject('ConnectionRepository')
    private readonly repo: ConnectionRepository,
    private readonly nodeId: NodeId,
    flushService: FlushService,
  ) {
    this.flushBuffer = flushService.createBuffer(
      async (items: SocketInfoWithUser[]) => {
        if (!items.length) return;

        const params = items.map((i) => ({
          userId: i.userId,
          socketId: i.socketId,
          nodeId: i.nodeId ?? this.nodeId.getValue(),
        }));

        await this.repo.refreshSocketsTTL(params);
      },
      {
        flushIntervalMs: 50,
        maxBatchSize: 500,
      },
    );
  }

  async execute(inputs: SocketInfoWithUser[]): Promise<void> {
    for (const input of inputs) {
      const payload: SocketInfoWithUser = {
        socketId: input.socketId,
        userId: input.userId,
        nodeId: input.nodeId ?? this.nodeId.getValue(),
      };
      this.flushBuffer.add(
        payload.socketId,
        payload,
        'RefreshConnectionTTLUseCase',
      );
    }
  }
}
