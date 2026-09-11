import { Injectable } from '@nestjs/common';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';

export type ResolveThreadOutput = {
  threadFbid: string | null;
  threadKey: string;
};

@Injectable()
export class ResolveThreadUseCase {
  constructor(private readonly threadRepo: TypeormInboxThreadRepository) {}

  async execute(
    viewerId: string,
    threadKey: string,
  ): Promise<ResolveThreadOutput> {
    if (!viewerId || !threadKey) {
      throw new Error('viewerId or threadKey is missing');
    }

    const threadResult = await this.threadRepo.resolveThread(
      viewerId,
      threadKey,
    );

    return {
      threadFbid: threadResult.threadFbid,
      threadKey: threadResult.threadKey,
    };
  }
}