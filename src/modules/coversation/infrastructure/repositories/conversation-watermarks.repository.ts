import { AppLogger } from '@/shared/logger/applogger';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ConversationWatermarkRaw {
  conversation_id: string;
  participant_id: string;
  delivery_watermark_timestamp_ms: string;
  read_watermark_timestamp_ms: string;
}

export interface ParticipantReadWatermarkRaw {
  conversation_id: string;
  read_watermark_timestamp_ms: string;
}

@Injectable()
export class ConversationWatermarksRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ConversationWatermarksRepository.name);
  }

  async getWatermarks(
    conversationIds: string[],
  ): Promise<ConversationWatermarkRaw[]> {
    if (!conversationIds.length) return [];

    const placeholders = conversationIds.map(() => '?').join(',');

    return this.dataSource.query(
      `
      SELECT
        conversation_id,
        participant_id,
        delivery_watermark_timestamp_ms,
        read_watermark_timestamp_ms
      FROM conversation_watermarks
      WHERE conversation_id IN (${placeholders})
      `,
      conversationIds,
    );
  }

  async getReadWatermarksForParticipant(
    conversationIds: string[],
    participantId: string,
  ): Promise<ParticipantReadWatermarkRaw[]> {
    if (!conversationIds.length) return [];

    const placeholders = conversationIds.map(() => '?').join(',');

    return this.dataSource.query(
      `
      SELECT
        conversation_id,
        read_watermark_timestamp_ms
      FROM conversation_watermarks
      WHERE participant_id = ?
        AND conversation_id IN (${placeholders})
      `,
      [participantId, ...conversationIds],
    );
  }

  async advanceReadWatermark(
    conversationId: string,
    participantId: string,
    timestampMs: string,
  ): Promise<void> {
    await this.dataSource.query(
      `
      INSERT INTO conversation_watermarks
        (
          conversation_id,
          participant_id,
          delivery_watermark_timestamp_ms,
          read_watermark_timestamp_ms
        )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        read_watermark_timestamp_ms =
          GREATEST(
            read_watermark_timestamp_ms,
            VALUES(read_watermark_timestamp_ms)
          ),
        delivery_watermark_timestamp_ms =
          GREATEST(
            delivery_watermark_timestamp_ms,
            VALUES(read_watermark_timestamp_ms)
          )
      `,
      [conversationId, participantId, timestampMs, timestampMs],
    );
  }

  async advanceDeliveryWatermark(
    conversationId: string,
    participantId: string,
    timestampMs: string,
  ): Promise<void> {
    await this.dataSource.query(
      `
      INSERT INTO conversation_watermarks
        (
          conversation_id,
          participant_id,
          delivery_watermark_timestamp_ms,
          read_watermark_timestamp_ms
        )
      VALUES (?, ?, ?, '0')
      ON DUPLICATE KEY UPDATE
        delivery_watermark_timestamp_ms =
          GREATEST(
            delivery_watermark_timestamp_ms,
            VALUES(delivery_watermark_timestamp_ms)
          )
      `,
      [conversationId, participantId, timestampMs],
    );
  }

  async advanceBoth(
    conversationId: string,
    participantId: string,
    deliveryTimestampMs: string,
    readTimestampMs: string,
  ): Promise<void> {
    await this.dataSource.query(
      `
      INSERT INTO conversation_watermarks
        (
          conversation_id,
          participant_id,
          delivery_watermark_timestamp_ms,
          read_watermark_timestamp_ms
        )
      VALUES (?, ?, GREATEST(?, ?), ?)
      ON DUPLICATE KEY UPDATE
        read_watermark_timestamp_ms =
          GREATEST(
            read_watermark_timestamp_ms,
            VALUES(read_watermark_timestamp_ms)
          ),
        delivery_watermark_timestamp_ms =
          GREATEST(
            delivery_watermark_timestamp_ms,
            VALUES(delivery_watermark_timestamp_ms),
            VALUES(read_watermark_timestamp_ms)
          )
      `,
      [
        conversationId,
        participantId,
        deliveryTimestampMs,
        readTimestampMs,
        readTimestampMs,
      ],
    );
  }
}
