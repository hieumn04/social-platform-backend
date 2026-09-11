// import { IAffinityRepository } from '@/modules/affinity/domain/repositories/affinity.repository';
// import { Injectable } from '@nestjs/common';
// import { DataSource } from 'typeorm';

// @Injectable()
// export class AffinityRepositoryImpl implements IAffinityRepository {
//   constructor(private readonly dataSource: DataSource) {}

//   async getScore(viewerId: string, targetUserId: string): Promise<FollowScore | null> {
//     const query = `
//       SELECT viewer_id, target_user_id, interaction_score, follow_score, final_score, dirty_flag, updated_at
//       FROM follow_score
//       WHERE viewer_id = ? AND target_user_id = ?
//       LIMIT 1
//     `;
//     const rows = await this.dataSource.query(query, [viewerId, targetUserId]);
//     if (!rows.length) return null;
//     const r = rows[0];
//     return new FollowScore(r.viewer_id, r.target_user_id, Number(r.interaction_score), Number(r.follow_score), Number(r.final_score), !!r.dirty_flag, r.updated_at);
//   }

//   async upsertScore(data: Partial<FollowScore> & { viewerId: string, targetUserId: string }): Promise<void> {
//     const interactionScore = data.interactionScore ?? 0;
//     const followScore = data.followScore ?? 0;
//     const finalScore = data.finalScore ?? (interactionScore + followScore); // simple formula

//     const query = `
//       INSERT INTO follow_score (viewer_id, target_user_id, interaction_score, follow_score, final_score, dirty_flag)
//       VALUES (?, ?, ?, ?, ?, ?)
//       ON DUPLICATE KEY UPDATE
//         interaction_score = VALUES(interaction_score),
//         follow_score = VALUES(follow_score),
//         final_score = VALUES(final_score),
//         dirty_flag = VALUES(dirty_flag),
//         updated_at = CURRENT_TIMESTAMP
//     `;
//     await this.dataSource.query(query, [data.viewerId, data.targetUserId, interactionScore, followScore, finalScore, data.dirtyFlag || false]);
//   }

//   async markAsDirty(viewerId: string, targetUserId: string): Promise<void> {
//     const query = `
//       UPDATE follow_score
//       SET dirty_flag = true, updated_at = CURRENT_TIMESTAMP
//       WHERE viewer_id = ? AND target_user_id = ?
//     `;
//     await this.dataSource.query(query, [viewerId, targetUserId]);
//   }

//   async getTopAffinity(viewerId: string, limit: number): Promise<FollowScore[]> {
//     const query = `
//       SELECT viewer_id, target_user_id, interaction_score, follow_score, final_score, dirty_flag, updated_at
//       FROM follow_score
//       WHERE viewer_id = ?
//       ORDER BY final_score DESC
//       LIMIT ?
//     `;
//     const rows = await this.dataSource.query(query, [viewerId, limit]);
//     return rows.map(r => new FollowScore(
//       r.viewer_id, r.target_user_id, Number(r.interaction_score), Number(r.follow_score), Number(r.final_score), !!r.dirty_flag, r.updated_at
//     ));
//   }
// }
