import {
  THREAD_ID_HASHER,
  ThreadIdHasher,
} from '@/modules/coversation/application/port/service/thread-id-hasher.interface';
import { Inject } from '@nestjs/common';

export class ThreadIdDeriver {
  constructor(
    @Inject(THREAD_ID_HASHER)
    private readonly hasher: ThreadIdHasher,
  ) {}

  deriveOneToOne(viewerId: string, peerUserId: string): string {
    if (!viewerId) throw new Error('viewerId is required');
    if (!peerUserId) throw new Error('peerUserId is required');

    const [a, b] =
      viewerId < peerUserId ? [viewerId, peerUserId] : [peerUserId, viewerId];

    return this.hasher.hash(`${a}:${b}`);
  }
}
