import { Message } from '@/modules/message/domain/models/messages.model';

export interface MessageFanout {
  /**
   * Fans out a message to specific participants' devices directly.
   * Includes clientContext for optimistic UI reconciliation.
   * Includes seq (Redis Stream ID) so client can track last_seq for delta sync.
   */
  fanout(
    message: Message,
    participantIds: string[],
    clientContext: string,
    seq: string,
  ): Promise<void>;
}
