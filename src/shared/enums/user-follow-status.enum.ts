export enum UserFollowStatus {
  NONE = 0,
  PENDING = 1,
  ACCEPTED = 2,
  REMOVED = 3,
  BLOCKED_SOFT = 4,
  BLOCKED_HARD = 5,
}

export enum UserFollowAction {
  // user intent
  FOLLOW_INTENT = 1,
  UNFOLLOW = 2,

  // request lifecycle
  REQUEST_APPROVED = 3,
  REQUEST_REJECTED = 4,
  REQUEST_CANCELED = 5,

  // relationship management
  REMOVE_FOLLOWER = 6,

  // block
  BLOCK = 7,
  UNBLOCK = 8,

  // system / safety
  SYSTEM_REMOVE = 9,
}
