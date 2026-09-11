import { DataSource } from 'typeorm';
import { ProfileReadRepositoryImpl } from './profile-read.repository.impl';

describe('ProfileReadRepositoryImpl', () => {
  it('maps the profile and aggregate counts returned by MySQL', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([
        {
          id: '454910464',
          username: 'hieunguyen',
          full_name: 'Nguyen Van Hieu',
          biography: null,
          profile_pic_url: null,
          is_verified: 0,
          is_private: 1,
          follower_count: '120',
          following_count: '85',
        },
      ]),
    } as unknown as jest.Mocked<DataSource>;
    const repository = new ProfileReadRepositoryImpl(dataSource);

    await expect(
      repository.findInitialProfileById('454910464'),
    ).resolves.toEqual({
      id: '454910464',
      username: 'hieunguyen',
      fullName: 'Nguyen Van Hieu',
      biography: null,
      profilePicUrl: null,
      isVerified: false,
      isPrivate: true,
      followerCount: 120,
      followingCount: 85,
    });

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM users u'),
      ['454910464'],
    );
  });

  it('returns null when the profile does not exist', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<DataSource>;
    const repository = new ProfileReadRepositoryImpl(dataSource);

    await expect(
      repository.findInitialProfileById('99999'),
    ).resolves.toBeNull();
  });
});
