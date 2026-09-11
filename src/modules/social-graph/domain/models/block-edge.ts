export class BlockEdge {
  constructor(
    public readonly blockerId: string,
    public readonly blockedId: string,
    public readonly createdAt: Date,
  ) {}
}
