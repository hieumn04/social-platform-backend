import { ShareSheetCandidate } from '@/modules/share-sheet/domain/models/share-sheet-candidate';

export const SHARE_SHEET_RANKING_REPOSITORY = 'IShareSheetRankingRepository';

export interface IShareSheetRankingRepository {
  findCandidates(
    viewerId: string,
    poolLimit: number,
  ): Promise<ShareSheetCandidate[]>;
}
