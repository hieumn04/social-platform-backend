import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { UserWriteRepository } from '@/modules/users/domain/repositories/user-write.interface.repository';
import { User } from '@/modules/users/domain/models/user.model';
import { Email } from '@/modules/value-objects/email';
import { PhoneNumber } from '@/modules/value-objects/phonenumber';
import { AppLogger } from '@/shared/logger/applogger';
import { UserRaw } from '@/types/typeModel/user-raw.type';
import { UpdatableUserFields } from '@/types/typeModel/userProp';
import { UserRawMapper } from '@/modules/users/infrastructure/mapper/user-raw.mapper';
import { USER_UPDATE_COLUMN_MAP } from '@/modules/users/infrastructure/constants/user-update-columns';

@Injectable()
export class UserWriteRepositoryImpl implements UserWriteRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserWriteRepositoryImpl.name);
  }

  async findById(id: string): Promise<User | null> {
    try {
      const rows = await this.dataSource.query<UserRaw[]>(
        `
        SELECT *
        FROM users
        WHERE user_id = ?
          AND is_deleted = false
        LIMIT 1
        `,
        [id],
      );

      return rows[0] ? UserRawMapper.toDomain(rows[0]) : null;
    } catch (err) {
      this.logger.error('Failed to find user by id', { id, err });
      throw err;
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    try {
      const rows = await this.dataSource.query<UserRaw[]>(
        `
        SELECT *
        FROM users
        WHERE email = ?
          AND is_deleted = false
        LIMIT 1
        `,
        [email.getValue()],
      );

      return rows[0] ? UserRawMapper.toDomain(rows[0]) : null;
    } catch (err) {
      this.logger.error('Failed to find user by email', {
        email: email.getValue(),
        err,
      });
      throw err;
    }
  }

  async findByPhoneNumber(phoneNumber: PhoneNumber): Promise<User | null> {
    try {
      const rows = await this.dataSource.query<UserRaw[]>(
        `
        SELECT *
        FROM users
        WHERE phone_number = ?
          AND is_deleted = false
        LIMIT 1
        `,
        [phoneNumber.getValue()],
      );

      return rows[0] ? UserRawMapper.toDomain(rows[0]) : null;
    } catch (err) {
      this.logger.error('Failed to find user by phone number', {
        phoneNumber: phoneNumber.getValue(),
        err,
      });
      throw err;
    }
  }

  async existsByEmail(email: Email): Promise<boolean> {
    try {
      const rows = await this.dataSource.query<{ is_exists: number }[]>(
        `
      SELECT EXISTS (
        SELECT 1
        FROM users
        WHERE email = ?
      ) AS is_exists
      `,
        [email.getValue()],
      );

      return rows[0]?.is_exists === 1;
    } catch (err) {
      this.logger.error('Failed to check user existence by email', {
        email: email.getValue(),
        err,
      });
      throw err;
    }
  }

  async existsByUsername(
    username: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    try {
      const runner = manager ?? this.dataSource;
      const rows = await runner.query<
        { is_exists: number | string | boolean }[]
      >(
        `
      SELECT EXISTS (
        SELECT 1
        FROM users
        WHERE LOWER(username) = LOWER(?)
      ) AS is_exists
      `,
        [username.trim()],
      );

      return Boolean(
        rows &&
          rows.length > 0 &&
          (rows[0].is_exists === 1 ||
            rows[0].is_exists === '1' ||
            rows[0].is_exists === true),
      );
    } catch (err) {
      this.logger.error('Failed to check user existence by username', {
        username,
        err,
      });
      throw err;
    }
  }

  async insert(user: User, manager?: EntityManager): Promise<void> {
    const runner = manager ?? this.dataSource;
    const u = user.toObject();

    try {
      await runner.query(
        `
        INSERT INTO users (
          user_id,
          identity_id,
          username,
          full_name,
          password_hash,
          email,
          phone_number,
          account_country,
          role_id,
          gender,
          has_anonymous_profile_picture,
          is_private,
          is_verified,
          is_active,
          is_deleted,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          u.userId,
          u.identityId,
          u.username,
          u.fullName,
          u.passwordHash.getValue(),
          u.email?.getValue() ?? null,
          u.phoneNumber?.getValue() ?? null,
          u.accountCountry,
          u.roleId,
          u.gender,
          u.hasAnonymousProfilePicture,
          u.isPrivate,
          u.isVerified,
          u.isActive,
          u.isDeleted,
          u.createdAt,
          u.updatedAt,
        ],
      );
    } catch (err) {
      this.logger.error('Failed to insert user', {
        userId: u.userId,
        identityId: u.identityId,
        err,
      });
      throw err;
    }
  }

  async update(
    id: string,
    fields: UpdatableUserFields,
    manager?: EntityManager,
  ): Promise<void> {
    if (!fields || Object.keys(fields).length === 0) {
      return;
    }

    const runner = manager ?? this.dataSource;
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;

      const column = USER_UPDATE_COLUMN_MAP[key as keyof UpdatableUserFields];
      if (!column) continue;

      sets.push(`${column} = ?`);
      values.push(value);
    }

    if (sets.length === 0) return;

    try {
      await runner.query(
        `
        UPDATE users
        SET ${sets.join(', ')},
            updated_at = NOW()
        WHERE user_id = ?
          AND is_deleted = false
        `,
        [...values, id],
      );
    } catch (err) {
      this.logger.error('Failed to update user', {
        userId: id,
        fields,
        err,
      });
      throw err;
    }
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const runner = manager ?? this.dataSource;

    try {
      await runner.query(
        `
        UPDATE users
        SET is_deleted = true, updated_at = NOW()
        WHERE user_id = ?
        `,
        [id],
      );
    } catch (err) {
      this.logger.error('Failed to soft delete user', { userId: id, err });
      throw err;
    }
  }
}
