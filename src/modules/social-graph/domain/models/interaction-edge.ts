export class InteractionEdge {
  constructor(
    public readonly actorId: string,
    public readonly targetId: string,
    public readonly interactionType: string,
    public readonly weight: number,
    public readonly createdAt: Date,
  ) {}
}
