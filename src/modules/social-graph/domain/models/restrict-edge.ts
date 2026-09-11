export class RestrictEdge {
  constructor(
    public readonly restrictorId: string,
    public readonly restrictedId: string,
    public readonly createdAt: Date,
  ) {}
}
