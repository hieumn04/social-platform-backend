import {
  ConversationParticipantRaw,
  ConversationParticipantSqlRow,
} from '@/types/typeModel/conversation-participant';

export class ConversationParticipantRawMapper {
  /* ---------------- core mapper ---------------- */

  static fromRow(
    row: ConversationParticipantSqlRow,
  ): ConversationParticipantRaw {
    return {
      conversation_id: String(row.conversation_id),
      user_id: String(row.user_id),
    };
  }

  static fromRows(
    rows: ConversationParticipantSqlRow[],
  ): ConversationParticipantRaw[] {
    return rows.map(this.fromRow);
  }

  /* ---------------- helper: group participants ---------------- */

  /**
   * Convert rows -> map conversation_id -> userIds[]
   * Useful for building participants list of threads
   */
  static toConversationUserMap(
    rows: ConversationParticipantSqlRow[],
  ): Record<string, string[]> {
    const map: Record<string, string[]> = {};

    for (const row of rows) {
      const convId = String(row.conversation_id);

      if (!map[convId]) {
        map[convId] = [];
      }

      map[convId].push(String(row.user_id));
    }

    return map;
  }

  /* ---------------- helper: unique userIds ---------------- */

  /**
   * Extract unique userIds
   * Useful when loading user profiles in batch
   */
  static extractUserIds(rows: ConversationParticipantSqlRow[]): string[] {
    const set = new Set<string>();

    for (const row of rows) {
      set.add(String(row.user_id));
    }

    return [...set];
  }

  /* ---------------- helper: conversationIds ---------------- */

  static extractConversationIds(
    rows: ConversationParticipantSqlRow[],
  ): string[] {
    const set = new Set<string>();

    for (const row of rows) {
      set.add(String(row.conversation_id));
    }

    return [...set];
  }
}
