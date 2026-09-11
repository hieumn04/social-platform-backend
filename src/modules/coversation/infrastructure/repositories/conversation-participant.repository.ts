import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import {
  ConversationParticipantRaw,
  ConversationParticipantSqlRow,
} from '@/types/typeModel/conversation-participant';
import { ConversationParticipantRawMapper } from '@/modules/coversation/infrastructure/mapper/conversation-participant.mapper';

@Injectable()
export class ConversationParticipantRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ConversationParticipantRepository.name);
  }

  async getParticipantsByConversationIds(
    conversationIds: string[],
  ): Promise<ConversationParticipantRaw[]> {
    if (!conversationIds.length) return [];

    const placeholders = conversationIds.map(() => '?').join(',');

    const sql = `
    SELECT DISTINCT conversation_id, user_id
    FROM conversation_participants
    WHERE conversation_id IN (${placeholders})
    AND status = 'ACTIVE'
  `;

    const rows: ConversationParticipantSqlRow[] = await this.dataSource.query(
      sql,
      conversationIds,
    );

    return ConversationParticipantRawMapper.fromRows(rows);
  }

  async getParticipantsByConversationId(
    conversationId: string,
  ): Promise<ConversationParticipantRaw[]> {
    const sql = `
    SELECT conversation_id, user_id
    FROM conversation_participants
    WHERE conversation_id = ?
    AND status = 'ACTIVE'
  `;

    const rows = await this.dataSource.query(sql, [conversationId]);
    return ConversationParticipantRawMapper.fromRows(rows);
  }

  async getPeerUserIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.dataSource.query<Array<{ user_id: string }>>(
      `
      SELECT DISTINCT cp2.user_id
      FROM conversation_participants cp1
      JOIN conversation_participants cp2
        ON cp1.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = ?
        AND cp1.status = 'ACTIVE'
        AND cp2.status = 'ACTIVE'
        AND cp2.user_id <> ?
      `,
      [userId, userId],
    );

    return rows.map((row) => row.user_id);
  }
}
