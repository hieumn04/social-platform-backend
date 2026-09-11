import { NestConfigService } from '@/shared/config/config.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SnowflakeIdGenerator {
  private static readonly EPOCH = 1704067200000;
  private static readonly WORKER_ID_BITS = 10;
  private static readonly SEQUENCE_BITS = 12;

  private static readonly MAX_WORKER_ID =
    (1 << SnowflakeIdGenerator.WORKER_ID_BITS) - 1;

  private static readonly MAX_SEQUENCE =
    (1 << SnowflakeIdGenerator.SEQUENCE_BITS) - 1;

  private lastTimestamp = -1;
  private sequence = 0;

  private readonly workerId: number;

  constructor(private readonly configService: NestConfigService) {
    this.workerId = this.configService.app.workerId;

    if (this.workerId > SnowflakeIdGenerator.MAX_WORKER_ID) {
      throw new Error(`workerId ${this.workerId} vượt giới hạn`);
    }
  }

  nextId(): string {
    return this.nextIdWithTimestamp().id;
  }

  /**
   * Generate an id and expose the exact logical timestamp encoded in it.
   *
   * Wall clocks can jump backwards after sleep/WSL/Docker time correction.
   * Waiting for Date.now() to catch up blocks message sending for the whole
   * rollback window. Keep a process-local logical clock instead: preserve the
   * last millisecond and use the sequence, then advance one logical
   * millisecond if the sequence is exhausted.
   */
  nextIdWithTimestamp(): { id: string; timestampMs: number } {
    let timestamp = Date.now();

    if (timestamp < this.lastTimestamp) {
      timestamp = this.lastTimestamp;
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence += 1;

      if (this.sequence > SnowflakeIdGenerator.MAX_SEQUENCE) {
        timestamp = this.lastTimestamp + 1;
        this.sequence = 0;
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    return {
      id: this.buildId(timestamp),
      timestampMs: timestamp,
    };
  }

  private buildId(timestamp: number): string {
    const id =
      (BigInt(timestamp - SnowflakeIdGenerator.EPOCH) <<
        BigInt(
          SnowflakeIdGenerator.WORKER_ID_BITS +
            SnowflakeIdGenerator.SEQUENCE_BITS,
        )) |
      (BigInt(this.workerId) << BigInt(SnowflakeIdGenerator.SEQUENCE_BITS)) |
      BigInt(this.sequence);

    return id.toString();
  }
}
