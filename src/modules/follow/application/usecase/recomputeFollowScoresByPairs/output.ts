import { RawFollowScoreRow } from "@/types/typeModel/followScore";

export interface LoadFollowSnapshotsByPairsOutput {
  rows: RawFollowScoreRow[];
  total: number;
}
