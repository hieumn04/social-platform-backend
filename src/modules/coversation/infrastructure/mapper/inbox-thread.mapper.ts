import { isGroupConversation } from '@/modules/coversation/infrastructure/mapper/conversation-subtype.mapper';

import { InboxThreadSqlRow } from '@/types/typeModel/inbox-thread.raw-row';

export class InboxThreadRawMapper {
  static toThreadNode(
    row: InboxThreadSqlRow,
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
    const threadFbid = String(row.thread_fbid);
    const conversationId = String(row.conversation_id);

    // Build users and viewer if context is provided
    let users: any[] = [];
    let viewer: any = null;

    if (context) {
      const { participantsMap, profileMap, blockedSet, restrictedSet } =
        context;
      const participantIds = participantsMap.get(conversationId) ?? [];
      const otherUserIds = participantIds.filter((id) => id !== userId);

      users = otherUserIds.map((id) => {
        const p = profileMap.get(id);
        return {
          id,
          username: p?.username ?? null,
          full_name: p?.full_name ?? null,
          profile_pic_url: p?.avatar_url ?? null,
          interop_messaging_user_fbid: p?.fbid_v2 ?? null,
          is_verified: p?.is_verified ?? false,
          friendship_status: {
            is_restricted: restrictedSet.has(id),
            blocking: blockedSet.has(id),
          },
        };
      });

      const viewerProfile = profileMap.get(userId);
      viewer = {
        id: userId,
        profile_pic_url: viewerProfile?.avatar_url ?? null,
        interop_messaging_user_fbid: viewerProfile?.fbid_v2 ?? null,
      };
    }

    const readReceipts = context?.readReceiptsMap?.get(conversationId) ?? [];

    return {
      id: threadFbid,
      __typename: 'SlideThreadNode',

      as_ig_direct_thread: {
        __typename: 'IGDirectThread',
        id: threadFbid,

        thread_id: conversationId,
        thread_fbid: threadFbid,

        thread_key: row.thread_key,
        thread_subtype: row.thread_subtype,

        is_group: isGroupConversation(row.thread_subtype),

        marked_as_unread: Boolean(row.marked_as_unread),

        last_activity_timestamp_ms: row.last_activity_at
          ? String(new Date(row.last_activity_at).getTime())
          : null,

        thread_title: row.display_name ?? users[0]?.full_name ?? null,
        thread_image_url:
          row.display_avatar_url ?? users[0]?.profile_pic_url ?? null,

        is_pin: Boolean(row.pinned),
        is_muted: Boolean(row.muted),

        input_mode: 0,

        system_folder: 'INBOX',

        folder: 'PRIMARY',

        messaging_folder_tag: 'INBOX',

        viewer_id: userId,

        reachability_status: row.reachability_status ?? null,

        users,
        viewer,
        nicknames: [],
        slide_read_receipts: readReceipts,
      },
    };
  }
}
