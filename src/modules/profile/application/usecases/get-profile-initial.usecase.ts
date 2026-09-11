import { GetFriendshipStatusUseCase } from '@/modules/social-graph/application/usecases/get-friendship-status.usecase';
import {
  IProfileReadRepository,
  PROFILE_READ_REPOSITORY,
} from '@/modules/profile/domain/repositories/profile-read.repository';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

export interface GetProfileInitialResult {
  viewer: {
    id: string;
  };
  profile: {
    id: string;
    username: string;
    full_name: string;
    biography: string | null;
    profile_pic_url: string | null;
    is_verified: boolean;
    is_private: boolean;
    follower_count: number;
    following_count: number;
    friendship_status: Awaited<
      ReturnType<GetFriendshipStatusUseCase['execute']>
    >;
  };
}

@Injectable()
export class GetProfileInitialUseCase {
  constructor(
    @Inject(PROFILE_READ_REPOSITORY)
    private readonly profileReadRepository: IProfileReadRepository,
    private readonly getFriendshipStatusUseCase: GetFriendshipStatusUseCase,
  ) {}

  async execute(
    viewerId: string,
    targetUserId: string,
  ): Promise<GetProfileInitialResult> {
    const profile =
      await this.profileReadRepository.findInitialProfileById(targetUserId);

    if (!profile) {
      throw new NotFoundException('Profile was not found');
    }

    const friendshipStatus = await this.getFriendshipStatusUseCase.execute(
      viewerId,
      targetUserId,
    );

    return {
      viewer: { id: viewerId },
      profile: {
        id: profile.id,
        username: profile.username,
        full_name: profile.fullName,
        biography: profile.biography,
        profile_pic_url: profile.profilePicUrl,
        is_verified: profile.isVerified,
        is_private: profile.isPrivate,
        follower_count: profile.followerCount,
        following_count: profile.followingCount,
        friendship_status: friendshipStatus,
      },
    };
  }
}
