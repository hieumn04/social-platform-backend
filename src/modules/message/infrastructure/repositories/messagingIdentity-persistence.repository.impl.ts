import { MessagingIdentityRepository } from '@/modules/message/domain/repositories/messagingIdentity.repository.interface';
import { MessagingPlatform } from '@/shared/enums/message.enum';
import { AppLogger } from '@/shared/logger/applogger';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class MessagingIdentityRepositoryImpl
  implements MessagingIdentityRepository
{
  private readonly TABLE = 'messaging_actors';

  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MessagingIdentityRepositoryImpl');
  }

  private query<T = any>(sql: string, params: any[]): Promise<T> {
    return this.dataSource.query(sql, params);
  }

  async insert(
    params: {
      userId: string;
      interopMessagingUserFbid: string;
      platform: MessagingPlatform;
    },
    manager: EntityManager,
  ): Promise<string> {
    const sql = `
      INSERT INTO ${this.TABLE}
        (interop_messaging_user_fbid, user_id, platform, created_at)
      VALUES
        (?, ?, ?, UTC_TIMESTAMP())
      ON DUPLICATE KEY UPDATE
        interop_messaging_user_fbid = VALUES(interop_messaging_user_fbid)
    `;

    try {
      await manager.query(sql, [
        params.interopMessagingUserFbid,
        params.userId,
        params.platform,
      ]);

      return params.interopMessagingUserFbid;
    } catch (error) {
      this.logger.error('Insert messaging actor failed', {
        error,
        params,
      });
      throw error;
    }
  }

  async getInteropIdByUserId(
    userId: string,
    platform: MessagingPlatform,
  ): Promise<string | null> {
    const sql = `
      SELECT interop_messaging_user_fbid
      FROM ${this.TABLE}
      WHERE user_id = ?
        AND platform = ?
      LIMIT 1
    `;

    const rows = await this.query<
      Array<{ interop_messaging_user_fbid: string }>
    >(sql, [userId, platform]);

    return rows[0]?.interop_messaging_user_fbid ?? null;
  }

  async exists(userId: string, platform: MessagingPlatform): Promise<boolean> {
    const sql = `
      SELECT 1
      FROM ${this.TABLE}
      WHERE user_id = ?
        AND platform = ?
      LIMIT 1
    `;

    const rows = await this.query(sql, [userId, platform]);
    return rows.length > 0;
  }
}
