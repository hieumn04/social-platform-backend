import {
  FollowersCandidateRow,
  FollowersCursor,
} from '@/types/typeModel/follows';
import { UserProfileQueryRow } from '@/types/typeModel/user-raw.type';

export interface GetFollowersOutput {
  rows: FollowersCandidateRow[];
  nextCursor: FollowersCursor | null;
  candidateIds: string[];
}

export interface GetFollowersOrchestratorOutput {
  rows: Array<
    FollowersCandidateRow & {
      profile: UserProfileQueryRow | null;
    }
  >;
  nextCursor: FollowersCursor | null;
}
