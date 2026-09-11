import { Injectable, NotFoundException } from '@nestjs/common';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { GetSlideMessageConnectionUseCase } from '@/modules/message/application/use-cases/slide-message/get-slide-messages.usecase';
import { SlideMessageConnection } from '@/types/typeModel/message-raw';

@Injectable()
export class GetThreadMessagePageUseCase {
  constructor(
    private readonly inboxRepo: TypeormInboxThreadRepository,
    private readonly messageConnectionUseCase: GetSlideMessageConnectionUseCase,
  ) {}

  async execute(input: {
    viewerId: string;
    threadFbid: string;
    before?: string | null;
    first?: number;
  }): Promise<SlideMessageConnection> {
    // This DB lookup is an authorization boundary. Never replace it with a
    // cache-only threadFbid -> conversationId lookup.
    const thread = await this.inboxRepo.findByViewerAndThreadFbId(
      input.viewerId,
      input.threadFbid,
    );

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return this.messageConnectionUseCase.executePage({
      conversationId: thread.conversation_id,
      threadFbid: input.threadFbid,
      before: input.before,
      limit: input.first,
    });
  }
}
