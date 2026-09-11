import { Gender } from '@/shared/enums/gender.enum';
import { FriendshipStatus } from '@/types/typeModel/follows';

export interface UserRaw {
  user_id: string;
  identity_id: string;
  username: string;
  full_name: string;
  bio: string | null;
  password_hash: string;
  email: string | null;
  phone_number: string | null;
  gender: Gender;
  avatar_url: string | null;
  profile_pic_id: string | null;
  has_anonymous_profile_picture: boolean;
  is_private: boolean;
  is_verified: boolean;
  verified_at: Date | null;
  account_country: string;
  role_id: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfileQueryRow {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  profile_pic_id: string | null;
  has_anonymous_profile_picture: boolean;
  is_private: boolean;
  is_verified: boolean;
  fbid_v2: string | null;
}

export interface IgThreadViewer {
  id: string;
  interop_messaging_user_fbid: string;
  profile_pic_url: string;
}

export interface ThreadUserRaw {
  id: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  friendship_status: FriendshipStatus;
  blocking: boolean;
}
