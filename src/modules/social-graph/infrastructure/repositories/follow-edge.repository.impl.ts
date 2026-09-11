import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IFollowEdgeRepository } from '../../domain/repositories/follow-edge.repository';
import { FollowEdge } from '../../domain/models/follow-edge';

@Injectable()
export class FollowEdgeRepositoryImpl implements IFollowEdgeRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getEdge(followerId: string, followingId: string): Promise<FollowEdge | null> {
    const query = `
      SELECT follower_id, following_id, created_at
      FROM follow_edge
      WHERE follower_id = ? AND following_id = ?
      LIMIT 1
    `;
    const rows = await this.dataSource.query(query, [followerId, followingId]);
    if (!rows.length) return null;
    return new FollowEdge(rows[0].follower_id, rows[0].following_id, rows[0].created_at);
  }

  async createEdge(followerId: string, followingId: string): Promise<void> {
    const query = `
      INSERT INTO follow_edge (follower_id, following_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE created_at = VALUES(created_at)
    `;
    await this.dataSource.query(query, [followerId, followingId]);
  }

  async deleteEdge(followerId: string, followingId: string): Promise<void> {
    const query = `
      DELETE FROM follow_edge
      WHERE follower_id = ? AND following_id = ?
    `;
    await this.dataSource.query(query, [followerId, followingId]);
  }
}
