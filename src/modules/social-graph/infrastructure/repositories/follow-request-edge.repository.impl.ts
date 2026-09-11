import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IFollowRequestEdgeRepository } from '../../domain/repositories/follow-request-edge.repository';
import { FollowRequestEdge } from '../../domain/models/follow-request-edge';

@Injectable()
export class FollowRequestEdgeRepositoryImpl
  implements IFollowRequestEdgeRepository
{
  constructor(private readonly dataSource: DataSource) {}

  async getEdge(
    requesterId: string,
    targetUserId: string,
  ): Promise<FollowRequestEdge | null> {
    const query = `
      SELECT requester_id, target_user_id, created_at
      FROM follow_request_edge
      WHERE requester_id = ? AND target_user_id = ?
      LIMIT 1
    `;
    const rows = await this.dataSource.query<
      Array<{
        requester_id: string;
        target_user_id: string;
        created_at: Date;
      }>
    >(query, [requesterId, targetUserId]);
    if (!rows.length) return null;
    return new FollowRequestEdge(
      rows[0].requester_id,
      rows[0].target_user_id,
      rows[0].created_at,
    );
  }

  async createEdge(requesterId: string, targetUserId: string): Promise<void> {
    const query = `
      INSERT INTO follow_request_edge (requester_id, target_user_id, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE created_at = created_at
    `;
    await this.dataSource.query(query, [requesterId, targetUserId]);
  }

  async deleteEdge(requesterId: string, targetUserId: string): Promise<void> {
    const query = `
      DELETE FROM follow_request_edge
      WHERE requester_id = ? AND target_user_id = ?
    `;
    await this.dataSource.query(query, [requesterId, targetUserId]);
  }
}
