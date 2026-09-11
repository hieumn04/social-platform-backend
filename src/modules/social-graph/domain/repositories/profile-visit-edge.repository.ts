import { ProfileVisitEdge } from '../models/profile-visit-edge';

export interface IProfileVisitEdgeRepository {
  recordVisit(visitorId: string, visitedId: string): Promise<void>;
  getRecentVisits(visitedId: string, limit: number): Promise<ProfileVisitEdge[]>;
}
