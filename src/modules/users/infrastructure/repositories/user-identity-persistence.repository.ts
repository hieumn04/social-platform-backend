import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { UserIdentity } from '@/modules/users/domain/models/user-identity.model';
import { UserIdentityRepository } from '@/modules/users/domain/repositories/user-identity.repository.interface';
import { AppLogger } from '@/shared/logger/applogger';

@Injectable()
export class UserIdentityRepositoryImpl implements UserIdentityRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('UserIdentityRepositoryImpl');
  }

  async insert(identity: UserIdentity, manager?: EntityManager): Promise<void> {
    const runner = manager?.queryRunner ?? this.dataSource;

    const sql = `
      INSERT INTO user_identities
        (identity_id, fbid_v2, Status, CreatedAt)
      VALUES
        (?, ?, ?, NOW())
    `;

    try {
      await runner.query(sql, [identity.id, identity.fbidV2, identity.status]);
    } catch (err) {
      this.logger.error('Failed to insert user identity', {
        identityId: identity.id,
        fbidV2: identity.fbidV2,
        error: err,
      });
      throw err;
    }
  }

  async findFbidV2ByIdentityId(identityId: string): Promise<string | null> {
    const sql = `
      SELECT fbid_v2
      FROM user_identities
      WHERE identity_id = ?
        AND Status = 'ACTIVE'
      LIMIT 1
    `;

    const rows: Array<{ fbid_v2: string }> = await this.dataSource.query(sql, [
      identityId,
    ]);

    return rows.length > 0 ? rows[0].fbid_v2 : null;
  }

  async existsByFbidV2(
    fbidV2: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const runner = manager?.queryRunner ?? this.dataSource;

    const sql = `
      SELECT 1
      FROM user_identities
      WHERE fbid_v2 = ?
      LIMIT 1
    `;

    const rows = await runner.query(sql, [fbidV2]);
    return rows.length > 0;
  }
}
