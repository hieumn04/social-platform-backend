export const PROFILE_READ_REPOSITORY = 'IProfileReadRepository';

export interface ProfileInitialReadModel {
  id: string;
  username: string;
  fullName: string;
  biography: string | null;
  profilePicUrl: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
}

export interface IProfileReadRepository {
  findInitialProfileById(
    userId: string,
  ): Promise<ProfileInitialReadModel | null>;
}
