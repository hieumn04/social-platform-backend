import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IMuteEdgeRepository } from '../../domain/repositories/mute-edge.repository';
import { MuteEdge } from '../../domain/models/mute-edge';

@Injectable()
export class MuteEdgeRepositoryImpl implements IMuteEdgeRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getEdge(muterId: string, mutedId: string): Promise<MuteEdge | null> {
    const query = `
      SELECT muter_id, muted_id, mute_posts, mute_stories, mute_notes, created_at, updated_at
      FROM mute_edge
      WHERE muter_id = ? AND muted_id = ?
      LIMIT 1
    `;
    const rows = await this.dataSource.query(query, [muterId, mutedId]);
    if (!rows.length) return null;
    return new MuteEdge(
      rows[0].muter_id, rows[0].muted_id, !!rows[0].mute_posts, !!rows[0].mute_stories, !!rows[0].mute_notes, rows[0].created_at, rows[0].updated_at
    );
  }

  async createEdge(muterId: string, mutedId: string, options: { mutePosts?: boolean; muteStories?: boolean; muteNotes?: boolean }): Promise<void> {
    const mutePosts = options.mutePosts || false;
    const muteStories = options.muteStories || false;
    const muteNotes = options.muteNotes || false;

    const query = `
      INSERT INTO mute_edge (muter_id, muted_id, mute_posts, mute_stories, mute_notes)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        mute_posts = VALUES(mute_posts),
        mute_stories = VALUES(mute_stories),
        mute_notes = VALUES(mute_notes),
        updated_at = CURRENT_TIMESTAMP
    `;
    await this.dataSource.query(query, [muterId, mutedId, mutePosts, muteStories, muteNotes]);
  }

  async deleteEdge(muterId: string, mutedId: string): Promise<void> {
    const query = `
      DELETE FROM mute_edge
      WHERE muter_id = ? AND muted_id = ?
    `;
    await this.dataSource.query(query, [muterId, mutedId]);
  }
}
