export class FollowEdge {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly createdAt: Date,
  ) {}
}
