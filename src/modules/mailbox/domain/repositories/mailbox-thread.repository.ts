export interface MailboxThreadRepository {
  pinThread(userId: string, threadId: string): Promise<void>;
  unpinThread(userId: string, threadId: string): Promise<void>;
  markRead(userId: string, threadId: string): Promise<void>;
}
