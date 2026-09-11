import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IProfileVisitEdgeRepository } from '../../domain/repositories/profile-visit-edge.repository';
import { ProfileVisitEdge } from '../../domain/models/profile-visit-edge';

@Injectable()
export class ProfileVisitEdgeRepositoryImpl implements IProfileVisitEdgeRepository {
  constructor(private readonly dataSource: DataSource) {}

  async recordVisit(visitorId: string, visitedId: string): Promise<void> {
    const query = `
      INSERT INTO profile_visit_edge (visitor_id, visited_id)
      VALUES (?, ?)
    `;
    // Using auto-increment ID for profile visit edge
    await this.dataSource.query(query, [visitorId, visitedId]);
  }

  async getRecentVisits(
    visitedId: string,
    limit: number,
  ): Promise<ProfileVisitEdge[]> {
    const query = `
      SELECT visitor_id, visited_id, visited_at
      FROM profile_visit_edge
      WHERE visited_id = ?
      ORDER BY visited_at DESC
      LIMIT ?
    `;
    const rows = await this.dataSource.query<
      Array<{ visitor_id: string; visited_id: string; visited_at: Date }>
    >(query, [visitedId, limit]);
    return rows.map(
      (row) =>
        new ProfileVisitEdge(
          row.visitor_id,
          row.visited_id,
          row.visited_at,
        ),
    );
  }
}
