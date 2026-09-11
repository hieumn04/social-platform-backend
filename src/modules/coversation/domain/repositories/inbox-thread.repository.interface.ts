import { InboxThread } from '@/modules/coversation/domain/models/inbox-thread.model';

export interface InboxThreadRepository {
  findByThreadId(threadId: string): Promise<InboxThread | null>;
}
