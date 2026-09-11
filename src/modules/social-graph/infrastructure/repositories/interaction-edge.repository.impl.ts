import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IInteractionEdgeRepository } from '../../domain/repositories/interaction-edge.repository';
import { InteractionEdge } from '../../domain/models/interaction-edge';

@Injectable()
export class InteractionEdgeRepositoryImpl implements IInteractionEdgeRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getEdge(actorId: string, targetId: string, interactionType: string): Promise<InteractionEdge | null> {
    const query = `
      SELECT actor_id, target_id, interaction_type, weight, created_at
      FROM interaction_edge
      WHERE actor_id = ? AND target_id = ? AND interaction_type = ?
      LIMIT 1
    `;
    const rows = await this.dataSource.query(query, [actorId, targetId, interactionType]);
    if (!rows.length) return null;
    return new InteractionEdge(rows[0].actor_id, rows[0].target_id, rows[0].interaction_type, rows[0].weight, rows[0].created_at);
  }

  async upsertEdge(actorId: string, targetId: string, interactionType: string, weightInfo: number): Promise<void> {
    const query = `
      INSERT INTO interaction_edge (actor_id, target_id, interaction_type, weight)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        weight = weight + VALUES(weight),
        created_at = CURRENT_TIMESTAMP
    `;
    await this.dataSource.query(query, [actorId, targetId, interactionType, weightInfo]);
  }
}
