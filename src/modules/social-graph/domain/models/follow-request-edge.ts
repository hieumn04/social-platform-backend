export class FollowRequestEdge {
  constructor(
    public readonly requesterId: string,
    public readonly targetUserId: string,
    public readonly createdAt: Date,
  ) {}
}
