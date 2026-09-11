import {
  ConversationSubtype,
  InboxFolder,
  ReachabilityStatus,
  SystemFolder,
} from '@/shared/enums/roomStatus.enum';
import {
  IgThreadViewer,
  UserProfileQueryRow,
} from '@/types/typeModel/user-raw.type';

export interface InboxThreadSqlRow {
  thread_fbid: string;
  thread_key: string;
  thread_subtype: ConversationSubtype;
  last_activity_at: Date | string | null;
  marked_as_unread: boolean;
  pinned: number | boolean;
  conversation_id: string;
  display_name: string | null;
  display_avatar_url: string | null;
  last_message_id: string;
  reachability_status: string | null;
  muted: number | boolean;
}

export interface SlideReadReceiptRaw {
  participant_fbid: string;
  watermark_timestamp_ms: string;
}

export interface InboxThreadRaw {
  thread_fbid: string | null;

  thread_key: string;

  thread_subtype: string;

  is_group: boolean;

  last_activity_timestamp_ms: string | null;

  marked_as_unread: boolean;

  is_pin: boolean;

  input_mode: number;

  conversation_id: string;

  slide_read_receipts: SlideReadReceiptRaw[];
}

export type InboxThreadWithUsers = InboxThreadRaw & {
  users: UserProfileQueryRow[];
};

export interface ThreadRaw {
  thread_fbid: string | null;

  thread_key: string;

  thread_subtype: string;

  system_folder: string;

  reachability_status: string;

  display_avatar_url: string;

  display_name: string;

  conversation_id: string;
}

export interface ThreadResponse {
  thread_fbid: string;
  thread_key: string;
  thread_subtype: string;

  thread_title: string | null;
  thread_image_url: string | null;

  nicknames: string[];

  reachability_status: string;

  messaging_folder_tag: string;
}

export interface IgDirectThread {
  id: string;
  thread_fbid: string;
  thread_igid: string;

  thread_key: string;
  thread_subtype: string;

  is_group: boolean;

  users: UserProfileQueryRow[];
  viewer: IgThreadViewer;
  viewer_id: string;

  thread_title: string | null;
  thread_image_url: string | null;

  nicknames: string[];

  reachability_status: string;
  messaging_folder_tag: string;

  instamadillo_cutover: string | null;
}

export interface IgThreadPreviewRow {
  thread_fbid: string;
  thread_subtype: ConversationSubtype;
  thread_key: string;
  viewer_id: string;
  display_name: string | null;
  display_avatar_url: string | null;
  reachability_status: ReachabilityStatus;
  system_folder: SystemFolder;
  conversation_id: string;
  last_activity_at?: Date | string | null;
  last_message_id?: string | null;
  marked_as_unread?: boolean;
  pinned?: number | boolean;
  muted?: number | boolean;
}

export interface IgThreadResponse {
  thread_fbid: string;
  thread_subtype: ConversationSubtype;
  thread_key: string;
  viewer_id: string;
  thread_title: string | null;
  thread_image_url: string | null;
  messaging_folder_tag: SystemFolder;
  reachability_status: ReachabilityStatus;
}
