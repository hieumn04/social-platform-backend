import { FriendshipStatusModel } from '@/types/typeModel/follows';

export interface ShowManyFriendshipsOutput {
  friendship_statuses: Record<string, FriendshipStatusModel>;
  ordered_user_ids?: string[];
}
