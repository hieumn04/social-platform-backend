import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SnowflakeIdGenerator } from '@/shared/snowflake-generator/snowflakeId-generator';
import { PushSubscriptionEntity } from '../typeorm/entities/push-subscription.entity';

@Injectable()
export class PushSubscriptionRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly idGenerator: SnowflakeIdGenerator,
  ) { }

  async saveOrUpdateSubscription(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent: string | null,
  ): Promise<PushSubscriptionEntity> {
    const selectSql = `
      SELECT id, user_id, endpoint
      FROM push_subscriptions
      WHERE endpoint = ?
      LIMIT 1
    `;
    const rows = await this.dataSource.query(selectSql, [endpoint]);

    let id = this.idGenerator.nextId();
    const now = new Date();

    if (rows && rows.length > 0) {
      id = rows[0].id;
      const updateSql = `
        UPDATE push_subscriptions
        SET user_id = ?, p256dh = ?, auth = ?, user_agent = ?, revoked_at = NULL, updated_at = NOW()
        WHERE endpoint = ?
      `;
      await this.dataSource.query(updateSql, [userId, p256dh, auth, userAgent, endpoint]);
    } else {
      const insertSql = `
        INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, revoked_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
      `;
      await this.dataSource.query(insertSql, [id, userId, endpoint, p256dh, auth, userAgent]);
    }

    const result = new PushSubscriptionEntity();
    result.id = id;
    result.userId = userId;
    result.endpoint = endpoint;
    result.p256dh = p256dh;
    result.auth = auth;
    result.userAgent = userAgent;
    result.revokedAt = null;
    result.createdAt = now;
    result.updatedAt = now;

    return result;
  }

  async revokeSubscription(userId: string, endpoint: string): Promise<void> {
    const sql = `
      UPDATE push_subscriptions
      SET revoked_at = NOW(), updated_at = NOW()
      WHERE user_id = ? AND endpoint = ?
    `;
    await this.dataSource.query(sql, [userId, endpoint]);
  }

  async getActiveSubscriptions(userId: string): Promise<PushSubscriptionEntity[]> {
    const sql = `
      SELECT
        id,
        user_id AS userId,
        endpoint,
        p256dh,
        auth,
        user_agent AS userAgent,
        revoked_at AS revokedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM push_subscriptions
      WHERE user_id = ? AND revoked_at IS NULL
    `;
    return this.dataSource.query(sql, [userId]);
  }

  async revokeMany(endpoints: string[]): Promise<void> {
    if (!endpoints.length) return;
    const placeholders = endpoints.map(() => '?').join(',');
    const sql = `
      UPDATE push_subscriptions
      SET revoked_at = NOW(), updated_at = NOW()
      WHERE endpoint IN (${placeholders})
    `;
    await this.dataSource.query(sql, endpoints);
  }
}
