import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AppLogger } from '@/shared/logger/applogger';
import { FlushBuffer } from '@/shared/flush/flush-buffer';
import { FlushBufferOptions, FlushHandler } from '@/types/flush/flush.type';

@Injectable()
export class FlushService implements OnModuleDestroy {
  private readonly buffers: FlushBuffer<unknown>[] = [];

  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('FlushService');
  }

  /**
   * Create a new FlushBuffer instance
   * - Each use case should own its buffer
   * - FlushService manages lifecycle only
   */
  createBuffer<T>(
    handler: FlushHandler<T>,
    options?: FlushBufferOptions,
  ): FlushBuffer<T> {
    const buffer = new FlushBuffer<T>(
      this.logger,
      async (items: T[]) => {
        if (!items.length) return;

        this.logger.debug('Flushing batch', {
          batchSize: items.length,
        });

        await handler(items);
      },
      options,
    );

    this.buffers.push(buffer as FlushBuffer<unknown>);
    return buffer;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.buffers.map((buffer) => buffer.shutdown()));
  }
}
