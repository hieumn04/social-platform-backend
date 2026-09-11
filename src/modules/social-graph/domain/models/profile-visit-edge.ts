export class ProfileVisitEdge {
  constructor(
    public readonly visitorId: string,
    public readonly visitedId: string,
    public readonly visitedAt: Date,
  ) {}
}
