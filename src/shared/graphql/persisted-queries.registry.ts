export const DirectViewerThread = `
query DirectViewerThread($threadFbid: ID!) {
  get_slide_thread_nullable(threadFbid: $threadFbid) {
    id

    as_ig_direct_thread {
     __typename
      thread_fbid
      thread_title
      thread_subtype
      thread_image_url

      messaging_folder_tag
      reachability_status

      viewer_id
      is_group
      thread_key

      users {
        id
        username
        full_name
        profile_pic_url
        is_verified

        friendship_status {
          is_restricted
          blocking
        }
      }

      viewer {
        id
        profile_pic_url
        interop_messaging_user_fbid
      }

      nicknames
    }
  }
}
`;

export const OpenSlideThreadQuery = `
query OpenSlideThread(
  $thread_fbid: ID!
  $message_count: Int = 20
  $before: String
  $min_uq_seq_id: String
) {
  get_slide_thread_nullable(
    thread_fbid: $thread_fbid
    message_count: $message_count
    before: $before
    min_uq_seq_id: $min_uq_seq_id
  ) {
    id
    as_ig_direct_thread {
      id
      thread_fbid
      thread_id
      thread_key
      thread_title
      thread_image_url
      thread_subtype
      viewer_id
      is_group
      is_pin
      is_muted
      marked_as_unread
      last_activity_timestamp_ms
      messaging_folder_tag
      reachability_status
      viewer {
        id
        username
        full_name
        interop_messaging_user_fbid
        profile_pic_url
      }
      users {
        id
        username
        full_name
        profile_pic_url
        is_verified
        interop_messaging_user_fbid
        friendship_status {
          blocking
          is_restricted
        }
      }
      slide_read_receipts {
        participant_fbid
        watermark_timestamp_ms
        watermark_message_id
      }
      slide_messages {
        edges {
          cursor
          node {
            id
            message_id
            thread_fbid
            offline_threading_id
            sender_fbid
            timestamp_ms
            content_type
            text_body
            igd_snippet
            replied_to_message_id
            expiration_timestamp_ms
            view_expiration_timestamp_ms
            content {
              __typename
              ... on SlideMessageText {
                text_body
              }
              ... on SlideMessageXMAContent {
                payload
              }
              ... on SlideMessageImageContent {
                attachments {
                  attachment_fbid
                  attachment_type
                  attachment_cdn_url
                  preview_cdn_url
                  mime_type
                  size_bytes
                  width
                  height
                }
              }
            }
          }
        }
        page_info {
          has_next_page
          has_previous_page
          start_cursor
          end_cursor
        }
      }
    }
  }
}
`;

export const GetSlideThreadMessagesQuery = `
query GetSlideThreadMessages(
  $thread_fbid: ID!
  $first: Int = 20
  $before: String
) {
  get_slide_thread_messages(
    thread_fbid: $thread_fbid
    first: $first
    before: $before
  ) {
    edges {
      cursor
      node {
        id
        message_id
        thread_fbid
        offline_threading_id
        sender_fbid
        timestamp_ms
        content_type
        text_body
        igd_snippet
        replied_to_message_id
        expiration_timestamp_ms
        view_expiration_timestamp_ms
        content {
          __typename
          ... on SlideMessageText {
            text_body
          }
          ... on SlideMessageXMAContent {
            payload
          }
          ... on SlideMessageImageContent {
            attachments {
              attachment_fbid
              attachment_type
              attachment_cdn_url
              preview_cdn_url
              mime_type
              size_bytes
              width
              height
            }
          }
        }
      }
    }
    page_info {
      has_next_page
      has_previous_page
      start_cursor
      end_cursor
    }
  }
}
`;

export const GetSlideMailboxQuery = `
query GetSlideMailbox(
  $device_id_for_iris_subscription: String!
) {
  get_slide_mailbox_for_iris_subscription(
    device_id_for_iris_subscription: $device_id_for_iris_subscription
  ) {
    __typename
    iris_inactive_subscription_uq_seq_id
    unread_thread_count
    unread_state_seq

    threads_by_folder {
      edges {
        cursor
        node {
          id
          __typename

          as_ig_direct_thread {
            id
            last_activity_timestamp_ms
            thread_key
            thread_subtype

            marked_as_unread
            is_pin
            is_group

            thread_id
            slide_read_receipts {
              participant_fbid
              watermark_timestamp_ms
              watermark_message_id
            }

            slide_messages {
              edges {
                cursor
                node {
                  id
                  sender_fbid
                  timestamp_ms
                  content_type
                  text_body
                  igd_snippet
                  expiration_timestamp_ms
                  view_expiration_timestamp_ms
                  content {
                    __typename
                    ... on SlideMessageText {
                      text_body
                    }
                    ... on SlideMessageXMAContent {
                      payload
                    }
                    ... on SlideMessageImageContent {
                      attachments {
                        attachment_fbid
                        attachment_type
                        attachment_cdn_url
                        preview_cdn_url
                        mime_type
                        size_bytes
                        width
                        height
                      }
                    }
                    ... on SlideMessageImage {
                      url
                      width
                      height
                    }
                    ... on SlideMessageVideo {
                      url
                      duration
                      thumbnail
                    }
                    ... on SlideMessageSticker {
                      sticker_id
                    }
                  }
                }
              }

              page_info {
                has_next_page
                end_cursor
              }
            }

            users {
              id
              username
              full_name
              profile_pic_url
              is_verified

              friendship_status {
                is_restricted
                blocking
              }
            }

            thread_title
            viewer {
              id
              profile_pic_url
            }
            thread_image_url
            messaging_folder_tag
            is_muted
            thread_fbid
            system_folder
            folder

          }
        }
      }

      page_info {
        has_next_page
        end_cursor
      }
    }

    pinned_threads_v2 {
      id
      thread_title
      is_pin
    }
  }
}
`;

export const SendSlideMessageMutation = `
mutation SendSlideMessage($input: SendSlideMessageInput!) {
  send_slide_message(input: $input) {
    xig_direct_text_send_with_slide_messaging_response {
      message_id
      timestamp_ms
      id
    }
  }
}
`;

export const MarkSeenMutation = `
mutation MarkSeenMutation(
  $metadata: MarkSeenMetadataInput!
  $data: MarkSeenDataInput!
) {
  xig_direct_item_seen_mutation_with_slide_messaging_response(
    metadata: $metadata
    data: $data
  ) {
    __typename
    participant_fbid
    watermark_timestamp_ms
    watermark_message_id
    thread_unread
    unread_thread_count
    unread_state_seq
  }
}
`;

export const CreateDirectMediaUploadMutation = `
mutation CreateDirectMediaUpload($input: CreateDirectMediaUploadInput!) {
  create_direct_media_upload(input: $input) {
    upload_id
    object_key
    upload_url
    upload_headers {
      name
      value
    }
    expires_at
  }
}
`;

export const ResumeDirectMediaUploadMutation = `
mutation ResumeDirectMediaUpload($input: ResumeDirectMediaUploadInput!) {
  resume_direct_media_upload(input: $input) {
    upload_id
    object_key
    state
    object_exists
    upload_url
    upload_headers {
      name
      value
    }
    expires_at
    attached_message_id
  }
}
`;

export const GetDirectMessageSendStatusMutation = `
mutation GetDirectMessageSendStatus(
  $thread_fbid: ID!
  $offline_threading_id: String!
) {
  get_direct_message_send_status(
    thread_fbid: $thread_fbid
    offline_threading_id: $offline_threading_id
  ) {
    exists
    message_id
    timestamp_ms
    conversation_id
  }
}
`;

export const GetPresenceQuery = `
query GetPresence($userId: ID!) {
  getPresence(userId: $userId) {
    userId
    online
    lastActiveAt
  }
}
`;

export const GetUnreadThreadSummaryQuery = `
query GetUnreadThreadSummary {
  get_unread_thread_summary {
    unread_thread_count
    unread_state_seq
  }
}
`;

export const GetMultiplePresencesQuery = `
query GetMultiplePresences($userIds: [ID!]!) {
  getMultiplePresences(userIds: $userIds) {
    userId
    online
    lastActiveAt
  }
}
`;

export const CreateFriendshipMutation = `
mutation CreateFriendship(
  $target_user_id: ID!
  $container_module: String
  $nav_chain: String
) {
  xdt_create_friendship(
    target_user_id: $target_user_id
    container_module: $container_module
    nav_chain: $nav_chain
  ) {
    id
    username
    friendship_status {
      following
      outgoing_request
      followed_by
      is_bestie
    }
  }
}
`;

export const GetProfileInitialQuery = `
query GetProfileInitial($userID: ID!) {
  get_profile_initial(userID: $userID) {
    viewer {
      id
    }
    profile {
      id
      username
      full_name
      biography
      profile_pic_url
      is_verified
      is_private
      follower_count
      following_count
      friendship_status {
        following
        followed_by
        outgoing_request
        incoming_request
        blocking
        blocked_by
        is_restricted
        is_bestie
      }
    }
  }
}
`;

export const GetShareSheetRankingQuery = `
query GetShareSheetRanking($input: ShareSheetRankingInput!) {
  get_share_sheet_ranking(input: $input) {
    entities {
      user {
        id
        username
        full_name
        profile_pic_url
        is_verified
      }
      thread {
        id
        title
        profile_pic_url
      }
    }
    ranking {
      score_map {
        id
      }
    }
  }
}
`;

export const PERSISTED_QUERY_REGISTRY: Record<string, string> = {
  '36000282336225392': DirectViewerThread,
  '35214111628203068': OpenSlideThreadQuery,
  '35214111628203069': GetSlideThreadMessagesQuery,
  '27313801781553196': SendSlideMessageMutation,
  '27548200411446444': SendSlideMessageMutation,
  '26472232189128878': GetSlideMailboxQuery,
  '27356881703909995': MarkSeenMutation,
  '28000000000000001': GetPresenceQuery,
  '28000000000000002': GetMultiplePresencesQuery,
  '29000000000000003': CreateDirectMediaUploadMutation,
  '29000000000000004': ResumeDirectMediaUploadMutation,
  '29000000000000005': GetDirectMessageSendStatusMutation,
  '30000000000000001': GetUnreadThreadSummaryQuery,
  '26508036048874888': CreateFriendshipMutation,
  '28949219061332276': GetProfileInitialQuery,
  '26933070283055509': GetShareSheetRankingQuery,
};
