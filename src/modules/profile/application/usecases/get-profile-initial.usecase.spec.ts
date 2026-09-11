import { GetFriendshipStatusUseCase } from '@/modules/social-graph/application/usecases/get-friendship-status.usecase';
import { IProfileReadRepository } from '@/modules/profile/domain/repositories/profile-read.repository';
import { NotFoundException } from '@nestjs/common';
import { GetProfileInitialUseCase } from './get-profile-initial.usecase';

const friendshipStatus = {
  following: true,
  outgoing_request: false,
  incoming_request: false,
  followed_by: false,
  is_bestie: false,
  is_private: false,
  is_restricted: false,
  is_feed_favorite: false,
  blocking: false,
  blocked_by: false,
};

describe('GetProfileInitialUseCase', () => {
  const profileReadRepository: jest.Mocked<IProfileReadRepository> = {
    findInitialProfileById: jest.fn(),
  };
  const getFriendshipStatusUseCase = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GetFriendshipStatusUseCase>;

  const useCase = new GetProfileInitialUseCase(
    profileReadRepository,
    getFriendshipStatusUseCase,
  );

  beforeEach(() => jest.clearAllMocks());

  it('combines the profile projection with viewer friendship status', async () => {
    profileReadRepository.findInitialProfileById.mockResolvedValue({
      id: '454910464',
      username: 'hieunguyen',
      fullName: 'Nguyen Van Hieu',
      biography: 'Backend developer',
      profilePicUrl: 'https://cdn.example/avatar.jpg',
      isVerified: false,
      isPrivate: false,
      followerCount: 120,
      followingCount: 85,
    });
    getFriendshipStatusUseCase.execute.mockResolvedValue(friendshipStatus);

    await expect(useCase.execute('10001', '454910464')).resolves.toEqual({
      viewer: { id: '10001' },
      profile: {
        id: '454910464',
        username: 'hieunguyen',
        full_name: 'Nguyen Van Hieu',
        biography: 'Backend developer',
        profile_pic_url: 'https://cdn.example/avatar.jpg',
        is_verified: false,
        is_private: false,
        follower_count: 120,
        following_count: 85,
        friendship_status: friendshipStatus,
      },
    });

    expect(getFriendshipStatusUseCase.execute).toHaveBeenCalledWith(
      '10001',
      '454910464',
    );
  });

  it('rejects a missing or inactive profile before loading friendship state', async () => {
    profileReadRepository.findInitialProfileById.mockResolvedValue(null);

    await expect(useCase.execute('10001', '99999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(getFriendshipStatusUseCase.execute).not.toHaveBeenCalled();
  });
});
