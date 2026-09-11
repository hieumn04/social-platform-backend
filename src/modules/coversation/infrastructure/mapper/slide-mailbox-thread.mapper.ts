import { encodeCursor } from '@/helpers/helper';
import { InboxThreadRawMapper } from '@/modules/coversation/infrastructure/mapper/inbox-thread.mapper';
import { InboxThreadSqlRow } from '@/types/typeModel/inbox-thread.raw-row';
import { SlideMessageConnection } from '@/types/typeModel/message-raw';

type MessageMap = Map<string, SlideMessageConnection>;

export class SlideMailboxThreadMapper {
  static toEdges(
    threads: InboxThreadSqlRow[],
    messageMap: MessageMap,
    userId: string,
    context?: {
      participantsMap: Map<string, string[]>;
      profileMap: Map<string, any>;
      blockedSet: Set<string>;
      restrictedSet: Set<string>;
      readReceiptsMap?: Map<
        string,
        Array<{
          participant_fbid: string;
          watermark_timestamp_ms: string;
          watermark_message_id: string | null;
        }>
      >;
    },
  ) {
    return threads.map((thread) => {
      const threadNode = InboxThreadRawMapper.toThreadNode(
        thread,
        userId,
        context,
      );

      const connection = messageMap.get(thread.conversation_id) ?? {
        edges: [],
        page_info: {
          has_next_page: false,
          end_cursor: undefined,
        },
      };

      return {
        cursor: encodeCursor(thread.thread_fbid),

        node: {
          ...threadNode,

          as_ig_direct_thread: {
            ...threadNode.as_ig_direct_thread,

            slide_messages: connection,
          },
        },
      };
    });
  }
}
