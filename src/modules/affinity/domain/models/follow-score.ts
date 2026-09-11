export class FollowScore {
  constructor(
    public readonly viewerId: string,
    public readonly targetUserId: string,
    public readonly interactionScore: number,
    public readonly followScore: number,
    public readonly finalScore: number,
    public readonly dirtyFlag: boolean,
    public readonly updatedAt: Date,
  ) {}
}
