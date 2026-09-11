import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { INotificationPrefRepository } from '../../domain/repositories/notification-pref.repository';
import { NotificationPref } from '../../domain/models/notification-pref';

@Injectable()
export class NotificationPrefRepositoryImpl implements INotificationPrefRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getPref(viewerId: string, targetId: string): Promise<NotificationPref | null> {
    const query = `
      SELECT viewer_id, target_id, notify_posts, notify_stories, notify_reels, notify_live, created_at, updated_at
      FROM notification_pref
      WHERE viewer_id = ? AND target_id = ?
      LIMIT 1
    `;
    const rows = await this.dataSource.query(query, [viewerId, targetId]);
    if (!rows.length) return null;
    return new NotificationPref(
      rows[0].viewer_id, rows[0].target_id, !!rows[0].notify_posts, !!rows[0].notify_stories, !!rows[0].notify_reels, !!rows[0].notify_live, rows[0].created_at, rows[0].updated_at
    );
  }

  async upsertPref(viewerId: string, targetId: string, prefs: { notifyPosts?: boolean; notifyStories?: boolean; notifyReels?: boolean; notifyLive?: boolean }): Promise<void> {
    const notifyPosts = prefs.notifyPosts || false;
    const notifyStories = prefs.notifyStories || false;
    const notifyReels = prefs.notifyReels || false;
    const notifyLive = prefs.notifyLive || false;

    const query = `
      INSERT INTO notification_pref (viewer_id, target_id, notify_posts, notify_stories, notify_reels, notify_live)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        notify_posts = VALUES(notify_posts),
        notify_stories = VALUES(notify_stories),
        notify_reels = VALUES(notify_reels),
        notify_live = VALUES(notify_live),
        updated_at = CURRENT_TIMESTAMP
    `;
    await this.dataSource.query(query, [viewerId, targetId, notifyPosts, notifyStories, notifyReels, notifyLive]);
  }
}
