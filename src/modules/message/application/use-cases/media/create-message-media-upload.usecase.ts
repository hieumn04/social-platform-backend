import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { MessageMediaRepository } from '@/modules/message/infrastructure/repositories/message-media.repository';
import { R2StorageService } from '@/shared/storage/r2/r2-storage.service';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class CreateMessageMediaUploadUseCase {
  constructor(
    private readonly inboxRepo: TypeormInboxThreadRepository,
    private readonly mediaRepo: MessageMediaRepository,
    private readonly storage: R2StorageService,
  ) {}

  async execute(input: {
    viewerId: string;
    threadFbid: string;
    contentType: string;
    contentLength: number;
    width?: number | null;
    height?: number | null;
  }) {
    const mimeType = input.contentType.trim().toLowerCase();
    const extension = MIME_EXTENSIONS[mimeType];
    if (!extension) {
      throw new BadRequestException(
        'Only JPEG, PNG, WEBP and GIF images are supported',
      );
    }
    if (
      !Number.isInteger(input.contentLength) ||
      input.contentLength <= 0 ||
      input.contentLength > MAX_IMAGE_BYTES
    ) {
      throw new BadRequestException(
        'Image size must be between 1 byte and 15 MB',
      );
    }
    for (const dimension of [input.width, input.height]) {
      if (
        dimension != null &&
        (!Number.isInteger(dimension) || dimension <= 0 || dimension > 12000)
      ) {
        throw new BadRequestException('Image dimensions are invalid');
      }
    }

    const thread = await this.inboxRepo.findByViewerAndThreadFbId(
      input.viewerId,
      input.threadFbid,
    );
    if (!thread) throw new NotFoundException('Thread not found');

    const uploadId = randomUUID();
    const objectKey = `direct/${thread.conversation_id}/${input.viewerId}/${uploadId}.${extension}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const metadata = {
      'upload-id': uploadId,
      'owner-id': input.viewerId,
    };

    await this.mediaRepo.createUpload({
      uploadId,
      ownerId: input.viewerId,
      conversationId: thread.conversation_id,
      objectKey,
      mimeType,
      sizeBytes: input.contentLength,
      width: input.width ?? undefined,
      height: input.height ?? undefined,
      expiresAt,
    });

    const signed = await this.storage.createPresignedUploadUrl({
      key: objectKey,
      contentType: mimeType,
      contentLength: input.contentLength,
      metadata,
    });

    return {
      upload_id: uploadId,
      object_key: objectKey,
      upload_url: signed.url,
      upload_headers: Object.entries(signed.headers).map(([name, value]) => ({
        name,
        value,
      })),
      expires_at: signed.expiresAt.toISOString(),
    };
  }
}
