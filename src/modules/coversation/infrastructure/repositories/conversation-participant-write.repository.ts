import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import {
  ConversationRole,
  ParticipantStatus,
} from '@/shared/enums/roomStatus.enum';

export interface AddParticipantDto {
  conversationId: string;
  userId: string;
  role?: ConversationRole;
  nickname?: string;
}

@Injectable()
export class ConversationParticipantWriteRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('ConversationParticipantWriteRepository');
  }

  /* =====================================================
   * ADD PARTICIPANT (idempotent + rejoin-safe)
   * ===================================================== */
  async addParticipant(
    data: AddParticipantDto,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      INSERT INTO conversation_participants (
        conversation_id,
        user_id,
        role,
        status,
        nickname,
        joined_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        role = VALUES(role),
        nickname = COALESCE(VALUES(nickname), nickname),
        left_at = NULL,
        updated_at = NOW()
    `;

    await runner.query(sql, [
      data.conversationId,
      data.userId,
      data.role ?? ConversationRole.MEMBER,
      ParticipantStatus.ACTIVE,
      data.nickname ?? null,
    ]);
  }

  /* =====================================================
   * BULK ADD PARTICIPANTS (group create)
   * ===================================================== */
  async addParticipantsBulk(
    participants: AddParticipantDto[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!participants.length) return;

    const runner = manager ?? this.dataSource;

    const values: any[] = [];
    const placeholders = participants
      .map(() => '(?, ?, ?, ?, ?, NOW(), NOW())')
      .join(', ');

    for (const p of participants) {
      values.push(
        p.conversationId,
        p.userId,
        p.role ?? ConversationRole.MEMBER,
        ParticipantStatus.ACTIVE,
        p.nickname ?? null,
      );
    }

    const sql = `
      INSERT INTO conversation_participants (
        conversation_id,
        user_id,
        role,
        status,
        nickname,
        joined_at,
        updated_at
      )
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        role = VALUES(role),
        nickname = COALESCE(VALUES(nickname), nickname),
        left_at = NULL,
        updated_at = NOW()
    `;

    await runner.query(sql, values);
  }

  /* =====================================================
   * LEAVE CONVERSATION (soft)
   * ===================================================== */
  async leave(
    conversationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      UPDATE conversation_participants
      SET
        status = ?,
        left_at = NOW(),
        updated_at = NOW()
      WHERE conversation_id = ?
        AND user_id = ?
        AND status = ?
    `;

    await runner.query(sql, [
      ParticipantStatus.LEFT,
      conversationId,
      userId,
      ParticipantStatus.ACTIVE,
    ]);
  }

  /* =====================================================
   * REMOVE (ADMIN KICK)
   * ===================================================== */
  async remove(
    conversationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      UPDATE conversation_participants
      SET
        status = ?,
        left_at = NOW(),
        updated_at = NOW()
      WHERE conversation_id = ?
        AND user_id = ?
    `;

    await runner.query(sql, [
      ParticipantStatus.REMOVED,
      conversationId,
      userId,
    ]);
  }

  /* =====================================================
   * UPDATE ROLE (admin / member)
   * ===================================================== */
  async updateRole(
    conversationId: string,
    userId: string,
    role: ConversationRole,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      UPDATE conversation_participants
      SET
        role = ?,
        updated_at = NOW()
      WHERE conversation_id = ?
        AND user_id = ?
    `;

    await runner.query(sql, [role, conversationId, userId]);
  }

  /* =====================================================
   * UPDATE NICKNAME
   * ===================================================== */
  async updateNickname(
    conversationId: string,
    userId: string,
    nickname: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      UPDATE conversation_participants
      SET
        nickname = ?,
        updated_at = NOW()
      WHERE conversation_id = ?
        AND user_id = ?
    `;

    await runner.query(sql, [nickname, conversationId, userId]);
  }

  /* =====================================================
   * HARD DELETE (rare – cleanup job)
   * ===================================================== */
  async hardDelete(
    conversationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const runner = manager ?? this.dataSource;

    const sql = `
      DELETE FROM conversation_participants
      WHERE conversation_id = ?
        AND user_id = ?
    `;

    await runner.query(sql, [conversationId, userId]);
  }
}