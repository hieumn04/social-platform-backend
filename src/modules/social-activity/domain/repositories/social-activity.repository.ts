import { UserFollowEvent } from '../models/user-follow-event';

export interface ISocialActivityRepository {
  recordEvent(actorId: string, targetUserId: string, eventType: string, metadata: any): Promise<void>;
  getEventsForUser(userId: string, limit: number, offset: number): Promise<UserFollowEvent[]>;
}
