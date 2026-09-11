import { ResolveUserSocketsOutput } from '@/modules/chat/application/usecase/resolve-user-sockets.usecase/resolve-user-sockets.output';
import { ConnectionRepository } from '@/modules/chat/domain/repositories/connection.repository';
import { FlushBuffer } from '@/shared/flush/flush-buffer';
import { FlushService } from '@/shared/flush/flush.service';
import { SocketInfo, SocketInfoWithUser } from '@/types/socket/gateway';

import { Inject, Injectable } from '@nestjs/common';

interface ResolvePayload {
  userId: string;
  _resolve?: (result: SocketInfo[]) => void;
}

@Injectable()
export class ResolveUserSocketsUseCase {
  private readonly flushBuffer: FlushBuffer<ResolvePayload>;
  constructor(
    @Inject('ConnectionRepository')
    private readonly repo: ConnectionRepository,
    flushService: FlushService,
  ) {
    this.flushBuffer = flushService.createBuffer(
      async (items: ResolvePayload[]) => {
        if (!items.length) return;
        const userIds = items.map((i) => i.userId);
        const sockets: SocketInfoWithUser[] =
          await this.repo.resolveUsersSockets(userIds);
        const userMap: Record<string, SocketInfo[]> = {};
        for (const s of sockets) {
          if (!userMap[s.userId]) userMap[s.userId] = [];
          userMap[s.userId].push({ socketId: s.socketId, nodeId: s.nodeId });
        }

        items.forEach((p) => {
          p._resolve?.(userMap[p.userId] ?? []);
        });
      },
      {
        flushIntervalMs: 20,
        maxBatchSize: 500,
      },
    );
  }

  async execute(userId: string): Promise<ResolveUserSocketsOutput> {
    return new Promise((resolve) => {
      const payload: ResolvePayload = {
        userId,
        _resolve: (sockets) =>
          resolve(
            new ResolveUserSocketsOutput({
              [userId]: sockets,
            }),
          ),
      };
      this.flushBuffer.add(userId, payload, 'ResolveUserSocketsUseCase');
    });
  }

  async executeBatch(userIds: string[]): Promise<ResolveUserSocketsOutput> {
    const results = await Promise.all(userIds.map((uid) => this.execute(uid)));
    const mergedMap: Record<string, SocketInfo[]> = {};
    results.forEach((r) => Object.assign(mergedMap, r.map));
    return new ResolveUserSocketsOutput(mergedMap);
  }
}
