export class NotificationPref {
  constructor(
    public readonly viewerId: string,
    public readonly targetId: string,
    public readonly notifyPosts: boolean,
    public readonly notifyStories: boolean,
    public readonly notifyReels: boolean,
    public readonly notifyLive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
