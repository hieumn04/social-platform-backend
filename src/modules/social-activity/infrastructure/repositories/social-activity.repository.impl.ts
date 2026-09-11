import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ISocialActivityRepository } from '../../domain/repositories/social-activity.repository';
import { UserFollowEvent } from '../../domain/models/user-follow-event';

@Injectable()
export class SocialActivityRepositoryImpl implements ISocialActivityRepository {
  constructor(private readonly dataSource: DataSource) {}

  async recordEvent(actorId: string, targetUserId: string, eventType: string, metadata: any = {}): Promise<void> {
    const query = `
      INSERT INTO user_follow_event (actor_id, target_user_id, event_type, metadata)
      VALUES (?, ?, ?, ?)
    `;
    await this.dataSource.query(query, [actorId, targetUserId, eventType, JSON.stringify(metadata)]);
  }

  async getEventsForUser(userId: string, limit: number, offset: number): Promise<UserFollowEvent[]> {
    const query = `
      SELECT id, actor_id, target_user_id, event_type, metadata, created_at
      FROM user_follow_event
      WHERE target_user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.dataSource.query(query, [userId, limit, offset]);
    return rows.map(r => new UserFollowEvent(
      r.id, r.actor_id, r.target_user_id, r.event_type, r.metadata, r.created_at
    ));
  }
}
