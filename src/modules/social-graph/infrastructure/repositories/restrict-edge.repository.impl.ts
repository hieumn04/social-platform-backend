import { RestrictEdge } from '@/modules/social-graph/domain/models/restrict-edge';
import { IRestrictEdgeRepository } from '@/modules/social-graph/domain/repositories/restrict-edge.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RestrictEdgeRepositoryImpl implements IRestrictEdgeRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findRestrictedTargets(
    restrictorId: string,
    targetIds: string[],
  ): Promise<Set<string>> {
    if (!targetIds.length) return new Set();

    const placeholders = targetIds.map(() => '?').join(',');

    const query = `
    SELECT restricted_id
    FROM restrict_edge
    WHERE restrictor_id = ?
    AND restricted_id IN (${placeholders})
  `;

    const rows = await this.dataSource.query(query, [
      restrictorId,
      ...targetIds,
    ]);

    return new Set(rows.map((r: any) => String(r.restricted_id)));
  }
}
