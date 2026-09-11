import { MailboxEventRaw } from "@/types/typeModel/mailbox-event.raw";


export class MailboxEventRawMapper {
  static fromRow(row: any): MailboxEventRaw {
    return {
      seq: row.seq,
      userId: row.user_id,
      threadId: row.thread_id,
      eventType: row.event_type,
      messageId: row.message_id,
      actorId: row.actor_id,
      createdAt: row.created_at,
      payload: row.payload,
    };
  }

  static fromRows(rows: any[]): MailboxEventRaw[] {
    return rows.map((r) => this.fromRow(r));
  }
}