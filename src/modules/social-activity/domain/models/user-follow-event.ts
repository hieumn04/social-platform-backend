export class UserFollowEvent {
  constructor(
    public readonly id: string, // bigInt auto-increment
    public readonly actorId: string,
    public readonly targetUserId: string,
    public readonly eventType: string,
    public readonly metadata: any,
    public readonly createdAt: Date,
  ) {}
}
