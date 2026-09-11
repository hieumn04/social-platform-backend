export interface LoadFollowSnapshotsByPairsInput {
  pairs: {
    followerId: string;
    followingId: string;
  }[];

  limit?: number;
}
