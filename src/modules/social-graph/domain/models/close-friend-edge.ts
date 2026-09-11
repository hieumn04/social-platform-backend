export class CloseFriendEdge {
  constructor(
    public readonly userId: string,
    public readonly closeFriendId: string,
    public readonly createdAt: Date,
  ) {}
}
