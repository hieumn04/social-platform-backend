import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ICloseFriendEdgeRepository } from '../../domain/repositories/close-friend-edge.repository';
import { CloseFriendEdge } from '../../domain/models/close-friend-edge';

@Injectable()
export class CloseFriendEdgeRepositoryImpl
  implements ICloseFriendEdgeRepository
{
  constructor(private readonly dataSource: DataSource) {}

  async getEdge(
    userId: string,
    closeFriendId: string,
  ): Promise<CloseFriendEdge | null> {
    const query = `
      SELECT user_id, target_user_id, created_at
      FROM close_friend_edge
      WHERE user_id = ? AND target_user_id = ?
      LIMIT 1
    `;
    const rows = await this.dataSource.query<
      Array<{ user_id: string; target_user_id: string; created_at: Date }>
    >(query, [userId, closeFriendId]);
    if (!rows.length) return null;
    return new CloseFriendEdge(
      rows[0].user_id,
      rows[0].target_user_id,
      rows[0].created_at,
    );
  }

  async createEdge(userId: string, closeFriendId: string): Promise<void> {
    const query = `
      INSERT INTO close_friend_edge (user_id, target_user_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE created_at = created_at
    `;
    await this.dataSource.query(query, [userId, closeFriendId]);
  }

  async deleteEdge(userId: string, closeFriendId: string): Promise<void> {
    const query = `
      DELETE FROM close_friend_edge
      WHERE user_id = ? AND target_user_id = ?
    `;
    await this.dataSource.query(query, [userId, closeFriendId]);
  }
}
