import { AppLogger } from '@/shared/logger/applogger';
import { FlushBufferOptions, FlushHandler } from '@/types/flush/flush.type';

export class FlushBuffer<T> {
  private readonly buffer = new Map<string, T>();
  private timer: NodeJS.Timeout | null = null;
  private flushing = false;

  private readonly flushIntervalMs: number;
  private readonly maxBatchSize: number;

  constructor(
    private readonly logger: AppLogger,
    private readonly handler: FlushHandler<T>,
    options?: FlushBufferOptions,
  ) {
    this.logger.setContext('FlushBuffer');
    this.flushIntervalMs = options?.flushIntervalMs ?? 50;
    this.maxBatchSize = options?.maxBatchSize ?? 500;
  }

  add(key: string, item: T, context?: string): void {
    this.buffer.set(key, item);
    if (context) {
      this.logger.debug(`FlushBuffer add called`, {
        key,
        context,
        bufferSize: this.buffer.size,
      });
    }
    if (this.buffer.size > this.maxBatchSize) {
      void this.flush();
      return;
    }
    if (!this.timer) {
      this.timer = setTimeout(() => {
        void this.flush();
      }, this.flushIntervalMs);
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    if (!this.buffer.size) return;

    this.flushing = true;
    const batch = Array.from(this.buffer.values());

    this.buffer.clear();

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    try {
      await this.handler(batch);
    } catch (error) {
      /**
       * IMPORTANT:
       * FlushBuffer should NOT handle retry / logging / DLQ
       * Let caller decide (worker / usecase / saga)
       */
      throw error;
    } finally {
      this.flushing = false;
      if (this.buffer.size > 0) {
        void this.flush();
      }
    }
  }

  size(): number {
    return this.buffer.size;
  }

  async shutdown(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    await this.flush();
  }
}
