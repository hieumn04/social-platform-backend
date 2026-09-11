import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
  MessageMediaRepository,
  MediaUploadRow,
} from '@/modules/message/infrastructure/repositories/message-media.repository';
import { MessageType } from '@/shared/enums/message.enum';
import { R2StorageService } from '@/shared/storage/r2/r2-storage.service';
import { SendSlideMessageWithAttribution } from '@/types/typeModel/message';

export interface PreparedMessageContent {
  contentType: MessageType;
  text?: string;
  snippet?: string;
  payload?: Record<string, any>;
  uploads: MediaUploadRow[];
}

@Injectable()
export class MessageContentPreparationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mediaRepo: MessageMediaRepository,
    private readonly storage: R2StorageService,
  ) {}

  async prepare(
    senderId: string,
    conversationId: string,
    input: SendSlideMessageWithAttribution,
  ): Promise<PreparedMessageContent> {
    const contentType = input.content_type ?? MessageType.TEXT;

    if (contentType === MessageType.TEXT) {
      const text = input.text?.sensitive_string_value?.trim();
      if (!text)
        throw new BadRequestException('Text message must not be empty');
      return { contentType, text, snippet: text, uploads: [] };
    }

    if (contentType === MessageType.IMAGES) {
      return this.prepareImages(senderId, conversationId, input);
    }

    if (contentType === MessageType.MESSAGE_INLINE_SHARE) {
      return this.prepareInlineShare(senderId, input);
    }

    throw new BadRequestException(
      `Unsupported message content type: ${contentType}`,
    );
  }

  async hydratePayloadForDelivery(
    contentType: MessageType,
    payload?: Record<string, any>,
  ): Promise<Record<string, any> | undefined> {
    if (!payload || contentType !== MessageType.IMAGES) return payload;

    const attachments = Array.isArray(payload.attachments)
      ? await Promise.all(
          payload.attachments.map(async (attachment: Record<string, any>) => ({
            ...attachment,
            attachment_cdn_url: attachment.storage_key
              ? await this.storage.createPrivateDeliveryUrl(
                  attachment.storage_key,
                )
              : null,
            preview_cdn_url:
              attachment.preview_storage_key || attachment.storage_key
                ? await this.storage.createPrivateDeliveryUrl(
                    attachment.preview_storage_key ?? attachment.storage_key,
                  )
                : null,
          })),
        )
      : [];

    return { ...payload, attachments };
  }

  private async prepareImages(
    senderId: string,
    conversationId: string,
    input: SendSlideMessageWithAttribution,
  ): Promise<PreparedMessageContent> {
    const requested = input.attachments ?? [];
    if (requested.length < 1 || requested.length > 10) {
      throw new BadRequestException(
        'An image message requires 1 to 10 attachments',
      );
    }
    const ids = requested.map((item) => item.upload_id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Duplicate upload_id is not allowed');
    }

    const rows = await this.mediaRepo.findUploads(ids);
    const byId = new Map(rows.map((row) => [row.upload_id, row]));
    const uploads = ids
      .map((id) => byId.get(id))
      .filter((row): row is MediaUploadRow => Boolean(row));
    if (uploads.length !== ids.length)
      throw new BadRequestException('One or more uploads do not exist');

    await Promise.all(
      uploads.map(async (upload) => {
        if (
          upload.owner_id !== senderId ||
          upload.conversation_id !== conversationId
        ) {
          throw new BadRequestException(
            'Upload does not belong to this sender and thread',
          );
        }
        if (
          upload.status !== 'PENDING' ||
          new Date(upload.expires_at).getTime() <= Date.now()
        ) {
          throw new BadRequestException(
            'Upload has expired or was already attached',
          );
        }
        const metadata = await this.storage.getObjectMetadata(
          upload.object_key,
        );
        if (
          Number(metadata.ContentLength) !== Number(upload.size_bytes) ||
          metadata.ContentType?.toLowerCase() !==
            upload.mime_type.toLowerCase() ||
          metadata.Metadata?.['upload-id'] !== upload.upload_id ||
          metadata.Metadata?.['owner-id'] !== senderId
        ) {
          throw new BadRequestException(
            'Uploaded R2 object metadata does not match the upload session',
          );
        }
      }),
    );

    return {
      contentType: MessageType.IMAGES,
      snippet:
        uploads.length === 1 ? 'Sent a photo' : `Sent ${uploads.length} photos`,
      uploads,
      payload: {
        schema_version: 1,
        attachments: uploads.map((upload) => ({
          attachment_fbid: upload.upload_id,
          attachment_type: 2,
          storage_key: upload.object_key,
          preview_storage_key: null,
          mime_type: upload.mime_type,
          size_bytes: upload.size_bytes,
          width: upload.width,
          height: upload.height,
        })),
      },
    };
  }

  private async prepareInlineShare(
    senderId: string,
    input: SendSlideMessageWithAttribution,
  ): Promise<PreparedMessageContent> {
    const share = input.inline_share;
    if (
      !share?.target_id ||
      !['POST', 'CAROUSEL', 'REEL'].includes(share.target_type)
    ) {
      throw new BadRequestException('A valid inline_share target is required');
    }

    const rows = await this.dataSource.query<
      Array<{
        target_id: string;
        caption: string | null;
        owner_id: string;
        username: string | null;
        full_name: string | null;
        media_id: string | null;
        media_type: string | null;
        media_url: string | null;
      }>
    >(
      `SELECT p.Id AS target_id, p.Caption AS caption, p.user_id AS owner_id,
              u.username, u.full_name, pm.Id AS media_id, pm.Type AS media_type,
              pm.Url AS media_url
       FROM Posts p
       JOIN users u ON u.user_id = p.user_id AND u.is_deleted = false
       LEFT JOIN PostsMedia pm ON pm.PostId = p.Id
         AND (? IS NULL OR pm.Id = ?)
       WHERE p.Id = ? AND p.IsDeleted = false
         AND (
           p.user_id = ? OR u.is_private = false OR EXISTS (
             SELECT 1 FROM follow_edge f
             WHERE f.follower_id = ? AND f.following_id = p.user_id
           )
         )
       ORDER BY pm.Position ASC LIMIT 1`,
      [
        share.selected_media_id ?? null,
        share.selected_media_id ?? null,
        share.target_id,
        senderId,
        senderId,
      ],
    );
    const target = rows[0];
    if (!target) throw new NotFoundException('Shared post was not found');
    if (share.selected_media_id && !target.media_id) {
      throw new BadRequestException(
        'Selected media does not belong to the shared post',
      );
    }

    return {
      contentType: MessageType.MESSAGE_INLINE_SHARE,
      snippet: 'Shared a post',
      uploads: [],
      payload: {
        schema_version: 1,
        target_type: share.target_type,
        target_id: target.target_id,
        selected_media_id: target.media_id,
        snapshot: {
          owner_id: target.owner_id,
          username: target.username,
          full_name: target.full_name,
          title: target.caption,
          preview_url: target.media_url,
          media_type: target.media_type,
        },
      },
    };
  }
}
