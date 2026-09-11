import { MailboxEventOrmEntity } from '@/modules/mailbox/infrastructure/typeorm/entities/mailbox-event.orm-entity';
import { AppLogger } from '@/shared/logger/applogger';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class TypeormMailboxEventRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TypeormMailboxEventRepository.name);
  }

  /* ==============================
   * INSERT (idempotent + high performance)
   * ============================== */
  private async insertManyInternal(
    runner: EntityManager,
    events: MailboxEventOrmEntity[],
  ): Promise<void> {
    if (!events.length) return;

    const values: any[] = [];
    const placeholders: string[] = [];

    for (const e of events) {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?)');

      values.push(
        e.userId,
        e.seq,
        e.threadId,
        e.eventType,
        e.messageId,
        e.actorId,
        e.createdAt,
      );
    }

    const sql = `
      INSERT IGNORE INTO mailbox_events (
        user_id,
        seq,
        thread_id,
        event_type,
        message_id,
        actor_id,
        created_at
      )
      VALUES ${placeholders.join(',')}
    `;

    await runner.query(sql, values);

    this.logger.debug(`[MAILBOX INSERT] ${events.length}`);
  }

  async insertEvents(
    events: MailboxEventOrmEntity[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!events.length) return;

    if (manager) {
      return this.insertManyInternal(manager, events);
    }

    await this.dataSource.transaction(async (tx) => {
      await this.insertManyInternal(tx, events);
    });
  }

  async getEventsAfterSeq(
    userId: string,
    lastSeq: string,
    limit = 50,
  ): Promise<MailboxEventOrmEntity[]> {
    const sql = `
      SELECT user_id, seq, thread_id, event_type, message_id, actor_id, created_at
      FROM mailbox_events
      WHERE user_id = ?
        AND seq > ?
      ORDER BY seq ASC
      LIMIT ?
    `;

    return this.dataSource.query(sql, [userId, lastSeq, limit]);
  }
}
