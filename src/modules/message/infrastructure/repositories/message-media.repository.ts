import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

export interface MediaUploadRow {
  upload_id: string;
  owner_id: string;
  conversation_id: string;
  object_key: string;
  mime_type: string;
  size_bytes: string;
  width: number | null;
  height: number | null;
  status: 'PENDING' | 'ATTACHED' | 'EXPIRED';
  attached_message_id: string | null;
  expires_at: Date;
}

export interface ClaimedExpiredUpload {
  upload_id: string;
  object_key: string;
}

@Injectable()
export class MessageMediaRepository {
  constructor(private readonly dataSource: DataSource) {}

  async createUpload(input: {
    uploadId: string;
    ownerId: string;
    conversationId: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    expiresAt: Date;
  }): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO message_media_uploads
       (upload_id, owner_id, conversation_id, object_key, mime_type, size_bytes,
        width, height, status, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW(), NOW())`,
      [
        input.uploadId,
        input.ownerId,
        input.conversationId,
        input.objectKey,
        input.mimeType,
        input.sizeBytes,
        input.width ?? null,
        input.height ?? null,
        input.expiresAt,
      ],
    );
  }

  async findUploads(uploadIds: string[]): Promise<MediaUploadRow[]> {
    if (!uploadIds.length) return [];
    const placeholders = uploadIds.map(() => '?').join(',');
    return this.dataSource.query<MediaUploadRow[]>(
      `SELECT upload_id, owner_id, conversation_id, object_key, mime_type,
              size_bytes, width, height, status, attached_message_id, expires_at
       FROM message_media_uploads WHERE upload_id IN (${placeholders})`,
      uploadIds,
    );
  }

  async findUpload(uploadId: string): Promise<MediaUploadRow | null> {
    const rows = await this.findUploads([uploadId]);
    return rows[0] ?? null;
  }

  async expirePendingUpload(uploadId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE message_media_uploads
       SET status = 'EXPIRED', updated_at = NOW(6)
       WHERE upload_id = ? AND status = 'PENDING'`,
      [uploadId],
    );
  }

  async claimExpiredUploads(
    limit: number,
    cutoff = new Date(),
  ): Promise<ClaimedExpiredUpload[]> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<ClaimedExpiredUpload[]>(
        `SELECT upload_id, object_key
         FROM message_media_uploads
         WHERE status IN ('PENDING', 'EXPIRED')
           AND expires_at <= ?
           AND cleaned_at IS NULL
           AND cleanup_attempts < 10
           AND (cleanup_claimed_at IS NULL OR cleanup_claimed_at < DATE_SUB(NOW(6), INTERVAL 10 MINUTE))
         ORDER BY expires_at ASC
         LIMIT ?
         FOR UPDATE SKIP LOCKED`,
        [cutoff, limit],
      );

      for (const row of rows) {
        await manager.query(
          `UPDATE message_media_uploads
           SET status = 'EXPIRED', cleanup_claimed_at = NOW(6),
               cleanup_attempts = cleanup_attempts + 1, updated_at = NOW(6)
           WHERE upload_id = ?`,
          [row.upload_id],
        );
      }
      return rows;
    });
  }

  async markUploadCleaned(uploadId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE message_media_uploads
       SET cleaned_at = NOW(6), cleanup_claimed_at = NULL,
           cleanup_error = NULL, updated_at = NOW(6)
       WHERE upload_id = ? AND status = 'EXPIRED'`,
      [uploadId],
    );
  }

  async markUploadCleanupFailed(
    uploadId: string,
    error: string,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE message_media_uploads
       SET cleanup_claimed_at = NULL, cleanup_error = ?, updated_at = NOW(6)
       WHERE upload_id = ? AND status = 'EXPIRED'`,
      [error.slice(0, 1000), uploadId],
    );
  }

  async attachUploads(
    messageId: string,
    uploads: MediaUploadRow[],
    manager: EntityManager,
  ): Promise<void> {
    // Use the application clock because MySQL may run in another timezone.
    const attachBefore = new Date();
    for (const [position, upload] of uploads.entries()) {
      const update = await manager.query(
        `UPDATE message_media_uploads
         SET status = 'ATTACHED', attached_message_id = ?, updated_at = NOW()
         WHERE upload_id = ? AND status = 'PENDING' AND expires_at > ?`,
        [messageId, upload.upload_id, attachBefore],
      );
      const updateResult = Array.isArray(update) ? update[0] : update;
      const affectedRows =
        updateResult?.affectedRows ?? updateResult?.affected ?? 0;
      if (!affectedRows) {
        throw new Error(`Upload ${upload.upload_id} is no longer attachable`);
      }

      await manager.query(
        `INSERT INTO message_media
         (id, message_id, media_type, media_url, storage_key, thumbnail_url,
          preview_storage_key, mime_type, size_bytes, width, height, duration_ms, position)
         VALUES (?, ?, 'IMAGE', ?, ?, NULL, NULL, ?, ?, ?, ?, NULL, ?)`,
        [
          upload.upload_id,
          messageId,
          upload.object_key,
          upload.object_key,
          upload.mime_type,
          upload.size_bytes,
          upload.width,
          upload.height,
          position,
        ],
      );
    }
  }
}
