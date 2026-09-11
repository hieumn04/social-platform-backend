export interface MailboxEventRaw {
  seq: string;
  userId: string;
  threadId: string;
  eventType: number;
  messageId: string | null;
  actorId: string | null;
  createdAt: Date | string;
  payload: any;
}