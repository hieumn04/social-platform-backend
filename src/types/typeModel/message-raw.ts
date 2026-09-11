export interface MessageSqlRow {
  message_id: string;
  client_context: string;
  sender_fbid: string;
  content_type: string;
  text_body: string | null;
  igd_snippet: string | null;
  thread_id: string;
  timestamp_ms: string | number;
  expiration_timestamp_ms: string | number | null;
  view_expiration_timestamp_ms: string | number | null;
  reply_to_message_id: string | null;
  payload?: Record<string, any> | string | null;
}

export interface GetSlideMessageConnectionInput {
  threadId: string;
  limit?: number;

  cursorMessageId?: string;
}

export interface SlideMessageEdge {
  cursor: string;
  node: {
    id: string;
    message_id: string;
    thread_fbid: string;
    offline_threading_id: string;
    sender_fbid: string;
    timestamp_ms: string;

    content_type?: string;
    text_body: string | null;
    igd_snippet: string | null;

    expiration_timestamp_ms?: string | null;
    view_expiration_timestamp_ms?: string | null;

    content?: any;
    replied_to_message_id?: string | null;
  };
}

export interface SlideMessageConnection {
  edges: SlideMessageEdge[];
  page_info: {
    has_next_page: boolean;
    has_previous_page: boolean;
    start_cursor?: string;
    end_cursor?: string;
  };
}
