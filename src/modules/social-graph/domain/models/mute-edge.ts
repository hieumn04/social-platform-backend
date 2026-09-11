export class MuteEdge {
  constructor(
    public readonly muterId: string,
    public readonly mutedId: string,
    public readonly mutePosts: boolean,
    public readonly muteStories: boolean,
    public readonly muteNotes: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
