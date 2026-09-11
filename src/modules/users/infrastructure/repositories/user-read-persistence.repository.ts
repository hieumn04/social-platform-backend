import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserReadRepository } from '@/modules/users/domain/repositories/user-read.interface.repository';
import { AppLogger } from '@/shared/logger/applogger';
import {
  UserProfileReadModel,
  UserSearchReadModel,
} from '@/types/typeModel/userProp';
import { UserProfileQueryRow } from '@/types/typeModel/user-raw.type';

@Injectable()
export class UserReadRepositoryImpl implements UserReadRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserReadRepositoryImpl.name);
  }

  async findProfileById(id: string): Promise<UserProfileQueryRow | null> {
    try {
      const result = await this.dataSource.query<UserProfileQueryRow[]>(
        `
      SELECT
        u.user_id,
        u.username,
        u.full_name,
        u.avatar_url,
        u.profile_pic_id,
        u.has_anonymous_profile_picture,
        u.is_private,
        u.is_verified,
        ui.fbid_v2
      FROM users u
      LEFT JOIN user_identities ui
        ON ui.identity_id = u.identity_id
        AND ui.status = 'ACTIVE'
      WHERE u.user_id = ?
        AND u.is_deleted = false
      LIMIT 1
      `,
        [id],
      );

      return result[0] ?? null;
    } catch (error) {
      this.logger.error('findProfileById failed', {
        id,
        error,
      });
      throw error;
    }
  }

  async findProfilesByIds(
    ids: readonly string[],
  ): Promise<UserProfileQueryRow[]> {
    if (!ids.length) return [];

    try {
      const placeholders = ids.map(() => '?').join(', ');

      return await this.dataSource.query<UserProfileQueryRow[]>(
        `
        SELECT
          u.user_id ,
          u.username,
          u.full_name ,
          u.avatar_url ,
          u.profile_pic_id ,
          u.has_anonymous_profile_picture ,
          u.is_private,
          u.is_verified,
          ui.fbid_v2

        FROM users u
        LEFT JOIN user_identities ui
          ON ui.identity_id = u.identity_id
          AND ui.Status = 'ACTIVE'
        WHERE u.user_id IN (${placeholders})
          AND u.is_deleted = false
        `,
        [...ids],
      );
    } catch (error) {
      this.logger.error('findProfilesByIds failed', {
        ids,
        error,
      });
      throw error;
    }
  }

  async searchByUsername(
    keyword: string,
    limit = 20,
  ): Promise<UserSearchReadModel[]> {
    try {
      return await this.dataSource.query<UserSearchReadModel[]>(
        `
        SELECT
          u.user_id AS id,
          u.username,
          u.full_name  AS fullName,
          u.avatar_url AS avatarUrl,
          u.has_anonymous_profile_picture AS hasAnonymousProfilePicture,
          u.is_private AS isPrivate,
          u.is_verified AS isVerified
        FROM users u
        WHERE u.username LIKE ?
          AND u.is_deleted = false
        ORDER BY u.username
        LIMIT ?
        `,
        [`%${keyword}%`, limit],
      );
    } catch (error) {
      this.logger.error('searchByUsername failed', {
        keyword,
        limit,
        error,
      });
      throw error;
    }
  }
}
