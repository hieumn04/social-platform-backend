export interface FriendshipStatusData {
  following: boolean;
  incoming_request: boolean;
  outgoing_request: boolean;
  is_bestie: boolean;
  is_private: boolean;
  is_restricted: boolean;
  is_feed_favorite: boolean;
}

export class FriendshipStatusMapper {
  static toResponse(
    results: { targetUserId: string; data: Partial<FriendshipStatusData> }[]
  ): Record<string, FriendshipStatusData> {
    const responseMap: Record<string, FriendshipStatusData> = {};

    for (const result of results) {
      responseMap[result.targetUserId] = {
        following: result.data.following ?? false,
        incoming_request: result.data.incoming_request ?? false,
        is_bestie: result.data.is_bestie ?? false,
        is_private: result.data.is_private ?? false,
        is_restricted: result.data.is_restricted ?? false,
        outgoing_request: result.data.outgoing_request ?? false,
        is_feed_favorite: result.data.is_feed_favorite ?? false,
      };
    }

    return responseMap;
  }
}
