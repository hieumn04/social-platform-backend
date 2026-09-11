import { NotificationPref } from '../models/notification-pref';

export interface INotificationPrefRepository {
  getPref(viewerId: string, targetId: string): Promise<NotificationPref | null>;
  upsertPref(viewerId: string, targetId: string, prefs: { notifyPosts?: boolean; notifyStories?: boolean; notifyReels?: boolean; notifyLive?: boolean }): Promise<void>;
}
