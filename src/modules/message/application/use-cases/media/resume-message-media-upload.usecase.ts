import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import {
  MediaUploadRow,
  MessageMediaRepository,
} from '@/modules/message/infrastructure/repositories/message-media.repository';
import { R2StorageService } from '@/shared/storage/r2/r2-storage.service';

@Injectable()
export class ResumeMessageMediaUploadUseCase {
  constructor(
    private readonly inboxRepo: TypeormInboxThreadRepository,
    private readonly mediaRepo: MessageMediaRepository,
    private readonly storage: R2StorageService,
  ) {}

  async execute(input: {
    viewerId: string;
    threadFbid: string;
    uploadId: string;
  }) {
    const thread = await this.inboxRepo.findByViewerAndThreadFbId(
      input.viewerId,
      input.threadFbid,
    );
    if (!thread) throw new NotFoundException('Thread not found');

    const upload = await this.mediaRepo.findUpload(input.uploadId);
    if (
      !upload ||
      String(upload.owner_id) !== String(input.viewerId) ||
      String(upload.conversation_id) !== String(thread.conversation_id)
    ) {
      throw new NotFoundException('Upload session not found');
    }

    if (upload.status === 'ATTACHED') {
      return this.response(upload, 'ATTACHED', true);
    }
    if (
      upload.status === 'EXPIRED' ||
      new Date(upload.expires_at) <= new Date()
    ) {
      await this.mediaRepo.expirePendingUpload(upload.upload_id);
      return this.response(upload, 'EXPIRED', false);
    }

    try {
      const metadata = await this.storage.getObjectMetadata(upload.object_key);
      if (
        Number(metadata.ContentLength) !== Number(upload.size_bytes) ||
        metadata.ContentType?.toLowerCase() !==
          upload.mime_type.toLowerCase() ||
        metadata.Metadata?.['upload-id'] !== upload.upload_id ||
        metadata.Metadata?.['owner-id'] !== String(input.viewerId)
      ) {
        throw new BadRequestException(
          'Uploaded R2 object metadata does not match the upload session',
        );
      }
      return this.response(upload, 'ALREADY_UPLOADED', true);
    } catch (error) {
      if (!this.isObjectNotFound(error)) throw error;
    }

    const remainingSeconds = Math.floor(
      (new Date(upload.expires_at).getTime() - Date.now()) / 1000,
    );
    if (remainingSeconds <= 0) {
      await this.mediaRepo.expirePendingUpload(upload.upload_id);
      return this.response(upload, 'EXPIRED', false);
    }

    const signed = await this.storage.createPresignedUploadUrl({
      key: upload.object_key,
      contentType: upload.mime_type,
      contentLength: Number(upload.size_bytes),
      metadata: {
        'upload-id': upload.upload_id,
        'owner-id': String(input.viewerId),
      },
      expiresInSeconds: remainingSeconds,
    });

    return {
      ...this.response(upload, 'NEEDS_UPLOAD', false),
      upload_url: signed.url,
      upload_headers: Object.entries(signed.headers).map(([name, value]) => ({
        name,
        value,
      })),
      expires_at: signed.expiresAt.toISOString(),
    };
  }

  private response(
    upload: MediaUploadRow,
    state: 'NEEDS_UPLOAD' | 'ALREADY_UPLOADED' | 'ATTACHED' | 'EXPIRED',
    objectExists: boolean,
  ) {
    return {
      upload_id: upload.upload_id,
      object_key: upload.object_key,
      state,
      object_exists: objectExists,
      upload_url: null,
      upload_headers: [],
      expires_at: new Date(upload.expires_at).toISOString(),
      attached_message_id: upload.attached_message_id ?? null,
    };
  }

  private isObjectNotFound(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as {
      name?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };
    return (
      candidate.$metadata?.httpStatusCode === 404 ||
      candidate.name === 'NotFound' ||
      candidate.name === 'NoSuchKey' ||
      candidate.Code === 'NoSuchKey'
    );
  }
}
