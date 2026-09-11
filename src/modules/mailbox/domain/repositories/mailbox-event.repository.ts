import { EntityManager } from "typeorm";

import { MailboxEvent } from "@/modules/mailbox/domain/models/mailbox-event.entity";
import { MailboxEventRaw } from "@/types/typeModel/mailbox-event.raw";


export interface MailboxEventRepository {

  /**
   * Write side
   * Append mailbox event
   */
  appendEvent(
    event: MailboxEvent,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * Read side
   * Get latest events
   */
  getLatestEvents(
    userId: string,
    limit: number,
  ): Promise<MailboxEventRaw[]>;

  /**
   * Get events after sequence
   */
  getEventsAfterSeq(
    userId: string,
    seq: string,
    limit: number,
  ): Promise<MailboxEventRaw[]>;

  /**
   * Get events before sequence
   */
  getEventsBeforeSeq(
    userId: string,
    seq: string,
    limit: number,
  ): Promise<MailboxEventRaw[]>;

  /**
   * Get latest sequence for user mailbox
   */
  getLatestSeq(
    userId: string,
  ): Promise<string | null>;
}