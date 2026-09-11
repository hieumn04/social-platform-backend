export class WsRedisKeys {
  // static socket(nodeId: string, socketId: string) {
  //   return `ws:node:{${nodeId}}:socket:${socketId}`;
  // }

  // static nodeSockets(nodeId: string) {
  //   return `ws:node:{${nodeId}}:sockets`;
  // }

  // static nodeHeartbeat(nodeId: string) {
  //   return `ws:node:{${nodeId}}:heartbeat`;
  // }

  // static userSockets(userId: string) {
  //   return `ws:user:{${userId}}:sockets`;
  // }

  // static userSocketCount(userId: string) {
  //   return `ws:user:{${userId}}:socket_count`;
  // }

  // static userLastActive(userId: string) {
  //   return `ws:user:{${userId}}:last_active`;
  // }
  // static socketNode(socketId: string) {
  //   return `ws:idx:socket_node:${socketId}`;
  // }

  static threadMetaKey(threadId: string) {
    return `thread:{${threadId}}:meta`;
  }

  static participantsKey(threadId: string) {
    return `thread:{${threadId}}:participants`;
  }

  static userInboxKey(userId: string) {
    return `inbox:{${userId}}:threads`;
  }

  static userPinnedInboxKey(userId: string) {
    return `inbox:{${userId}}:pinned`;
  }

  static threadSummaryKey(threadId: string) {
    return `thread:{${threadId}}:summary`;
  }

  static recentMessagesGenerationKey(conversationId: string) {
    return `messages:{${conversationId}}:generation`;
  }

  static recentMessagesPageKey(
    conversationId: string,
    generation: string,
    limit: number,
  ) {
    return `messages:{${conversationId}}:latest:${generation}:${limit}`;
  }

  /**
   * Redis HASH key for per-conversation watermarks.
   * Fields: {participantId}:delivery  →  deliveryWatermarkTimestampMs
   *         {participantId}:read      →  readWatermarkTimestampMs
   *
   * One HGETALL returns ALL participants' states in a single RTT.
   *
   * Example:
   *   HSET conv:{threadFbid}:watermarks 17841470949244414:delivery 1780259964009
   *   HSET conv:{threadFbid}:watermarks 17841470949244414:read     1780259900000
   */
  static watermarkKey(threadFbid: string) {
    return `conv:{${threadFbid}}:watermarks`;
  }

  static readWatermarkStreamKey() {
    return 'conversation:read-watermarks';
  }

  // ─── Presence System ───────────────────────────────────────────────────────
  /**
   * ZSET: member = socketId, score = heartbeatAt (Unix ms via Redis TIME).
   * TTL = 90 s (OFFLINE_THRESHOLD_S).
   * Hash-tag {userId} ensures same cluster slot as activity().
   */
  static presenceConnections(userId: string) {
    return `presence:{${userId}}:connections`;
  }

  /**
   * STRING: Unix-ms timestamp of the user's last confirmed activity.
   * TTL = 3 days (ACTIVITY_TTL_S).
   * Hash-tag {userId} ensures same cluster slot as presenceConnections().
   */
  static activity(userId: string) {
    return `activity:{${userId}}`;
  }
}
