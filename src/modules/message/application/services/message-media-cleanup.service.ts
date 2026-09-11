import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';

import { MessageMediaRepository } from '@/modules/message/infrastructure/repositories/message-media.repository';
import { AppLogger } from '@/shared/logger/applogger';
import { R2StorageService } from '@/shared/storage/r2/r2-storage.service';

@Injectable()
export class MessageMediaCleanupService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly intervalMs = this.readPositiveInt(
    'MESSAGE_UPLOAD_CLEANUP_INTERVAL_MS',
    30 * 60 * 1000,
  );
  private readonly batchSize = Math.min(
    this.readPositiveInt('MESSAGE_UPLOAD_CLEANUP_BATCH_SIZE', 100),
    500,
  );

  constructor(
    private readonly mediaRepo: MessageMediaRepository,
    private readonly storage: R2StorageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MessageMediaCleanupService.name);
  }

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.runOnce(), this.intervalMs);
    this.timer.unref?.();
    const initial = setTimeout(() => void this.runOnce(), 30_000);
    initial.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const uploads = await this.mediaRepo.claimExpiredUploads(this.batchSize);
      for (const upload of uploads) {
        try {
          await this.storage.deleteObject(upload.object_key);
          await this.mediaRepo.markUploadCleaned(upload.upload_id);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          await this.mediaRepo.markUploadCleanupFailed(
            upload.upload_id,
            message,
          );
          this.logger.warn('Failed to clean expired direct-message upload', {
            uploadId: upload.upload_id,
            error: message,
          });
        }
      }
    } catch (error) {
      this.logger.error('Direct-message upload cleanup batch failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.running = false;
    }
  }

  private readPositiveInt(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }
}
