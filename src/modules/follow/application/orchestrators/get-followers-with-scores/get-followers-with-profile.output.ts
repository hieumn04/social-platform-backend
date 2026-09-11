import { FollowersCursor } from '@/types/typeModel/follows';

export interface InstagramFollowerResponse {
  // identifiers
  strong_id__: string;
  pk: string;
  pk_id: string;
  id: string;

  // basic profile
  username: string;
  full_name: string;

  // profile picture
  profile_pic_url: string | null;
  profile_pic_id: string | null;
  has_anonymous_profile_picture: boolean;

  // account state
  is_private: boolean;
  is_verified: boolean;
  is_favorite: boolean;

  // optional identity
  fbid_v2?: string | null;
  third_party_downloads_enabled?: number;

  latest_reel_media?: number | null;

  // badges
  account_badges?: unknown[];
}

export interface InstagramFollowersListResponse {
  users: InstagramFollowerResponse[];
  next_cursor: FollowersCursor | null;
  has_more: boolean;
  status: 'ok';
}
