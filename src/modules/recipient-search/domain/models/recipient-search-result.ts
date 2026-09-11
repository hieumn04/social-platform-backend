export interface RecipientSearchResult {
  id: string;
  username: string;
  fullName: string;
  profilePicUrl: string | null;
  isVerified: boolean;
  threadFbid: string | null;
}
