export interface ShareSheetCandidate {
  id: string;
  username: string;
  fullName: string;
  profilePicUrl: string | null;
  isVerified: boolean;
  directConversationCount: number;
  lastDirectAt: Date | null;
  isFollowing: boolean;
  isFollowedBy: boolean;
  followedAt: Date | null;
  affinityScore: number;
  affinityLastInteractionAt: Date | null;
  lastDmAt: Date | null;
  interactionScore: number;
  interactionLastAt: Date | null;
}
