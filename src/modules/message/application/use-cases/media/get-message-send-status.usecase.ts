import { Injectable, NotFoundException } from '@nestjs/common';

import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { MessageWriteRepository } from '@/modules/message/infrastructure/repositories/message-write.repository';

@Injectable()
export class GetMessageSendStatusUseCase {
  constructor(
    private readonly inboxRepo: TypeormInboxThreadRepository,
    private readonly messageRepo: MessageWriteRepository,
  ) {}

  async execute(input: {
    viewerId: string;
    threadFbid: string;
    offlineThreadingId: string;
  }) {
    const thread = await this.inboxRepo.findByViewerAndThreadFbId(
      input.viewerId,
      input.threadFbid,
    );
    if (!thread) throw new NotFoundException('Thread not found');

    const message = await this.messageRepo.findByClientContextForSender(
      String(thread.conversation_id),
      input.offlineThreadingId,
      input.viewerId,
    );

    return {
      exists: Boolean(message),
      message_id: message?.messageId ?? null,
      timestamp_ms: message ? String(message.timestampMs) : null,
      conversation_id: String(thread.conversation_id),
    };
  }
}
