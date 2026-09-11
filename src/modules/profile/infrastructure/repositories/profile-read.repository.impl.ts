import {
  IProfileReadRepository,
  ProfileInitialReadModel,
} from '@/modules/profile/domain/repositories/profile-read.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface ProfileInitialRow {
  id: string;
  username: string;
  full_name: string;
  biography: string | null;
  profile_pic_url: string | null;
  is_verified: boolean | number | string;
  is_private: boolean | number | string;
  follower_count: number | string;
  following_count: number | string;
}

@Injectable()
export class ProfileReadRepositoryImpl implements IProfileReadRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findInitialProfileById(
    userId: string,
  ): Promise<ProfileInitialReadModel | null> {
    const rows = await this.dataSource.query<ProfileInitialRow[]>(
      `SELECT
         CAST(u.user_id AS CHAR) AS id,
         u.username,
         u.full_name,
         u.bio AS biography,
         u.avatar_url AS profile_pic_url,
         u.is_verified,
         u.is_private,
         (
           SELECT COUNT(*)
           FROM follow_edge followers
           WHERE followers.following_id = u.user_id
         ) AS follower_count,
         (
           SELECT COUNT(*)
           FROM follow_edge followings
           WHERE followings.follower_id = u.user_id
         ) AS following_count
       FROM users u
       WHERE u.user_id = ?
         AND u.is_active = true
         AND u.is_deleted = false
       LIMIT 1`,
      [userId],
    );

    const row = rows[0];
    if (!row) return null;

    return {
      id: String(row.id),
      username: row.username,
      fullName: row.full_name,
      biography: row.biography,
      profilePicUrl: row.profile_pic_url,
      isVerified: this.toBoolean(row.is_verified),
      isPrivate: this.toBoolean(row.is_private),
      followerCount: Number(row.follower_count),
      followingCount: Number(row.following_count),
    };
  }

  private toBoolean(value: boolean | number | string): boolean {
    return value === true || value === 1 || value === '1';
  }
}
