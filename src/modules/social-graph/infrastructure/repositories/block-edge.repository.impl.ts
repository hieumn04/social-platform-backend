import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IBlockEdgeRepository } from '../../domain/repositories/block-edge.repository';
import { BlockEdge } from '@/modules/social-graph/domain/models/block-edge';

@Injectable()
export class BlockEdgeRepositoryImpl implements IBlockEdgeRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findBlockedTargets(
    blockerId: string,
    targetIds: string[],
  ): Promise<Set<string>> {
    if (!targetIds.length) return new Set();

    const placeholders = targetIds.map(() => '?').join(',');

    const query = `
      SELECT blocked_id
      FROM block_edge
      WHERE blocker_id = ?
      AND blocked_id IN (${placeholders})
    `;

    const rows = await this.dataSource.query(query, [blockerId, ...targetIds]);

    return new Set(rows.map((r: any) => r.blocked_id));
  }
}
