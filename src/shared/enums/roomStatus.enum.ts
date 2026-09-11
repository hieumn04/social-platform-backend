export enum ParticipantStatus {
  ACTIVE = 'ACTIVE',
  LEFT = 'LEFT',
  REMOVED = 'REMOVED',
  BLOCKED = 'BLOCKED',
}

export enum SystemFolder {
  INBOX = 'INBOX',
  MESSAGE_REQUESTS = 'MESSAGE_REQUESTS',
  ARCHIVED = 'ARCHIVED',
}

export enum ConversationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum ConversationSubtype {
  ONE_TO_ONE = 'IG_ONLY_ONE_TO_ONE',
  GROUP = 'IG_GROUP',
  BUSINESS = 'BUSINESS',
}

export enum InboxFolder {
  PRIMARY = 'PRIMARY', // Main inbox
  REQUESTS = 'REQUESTS', // Message requests (not following)
  HIDDEN = 'HIDDEN', // User hidden
  SPAM = 'SPAM', // Spam filtered
}

export enum ReachabilityStatus {
  REACHABLE = 'REACHABLE',
  UNREACHABLE = 'UNREACHABLE',
  PENDING = 'PENDING',
  REQUIRES_APPROVAL = 'REQUIRES_APPROVAL',
  BLOCKED = 'BLOCKED',
  RESTRICTED = 'RESTRICTED',
}

export enum MessagingFolderTag {
  INBOX = 'INBOX',
  PRIMARY = 'PRIMARY',
  GENERAL = 'GENERAL',
  REQUESTS = 'REQUESTS',
}
