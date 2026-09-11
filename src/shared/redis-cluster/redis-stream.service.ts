import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cluster } from 'ioredis';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { AppEvent } from '@/types/events/base.event';
import pLimit from 'p-limit';

export interface StreamMessage<T = any> {
  id: string;
  values: T;
}

@Injectable()
export class RedisStreamService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisStreamService.name);

  // ---------------- CONFIG ----------------
  private readonly MAX_RETRY = 3;
  private readonly IDEMPOTENT_TTL = 60 * 60;
  private readonly MAX_CONCURRENCY = 10;
  private readonly RECLAIM_IDLE = 60000;
  private readonly PROCESS_TIMEOUT = 10000;
  private readonly RECLAIM_COUNT = 20;

  private readonly limit = pLimit(this.MAX_CONCURRENCY);

  private isRunning = true;
  private processing = new Set<string>();

  private subscriberClient?: Cluster;

  constructor(private readonly redis: RedisClusterService) {}

  get client(): Cluster {
    return this.redis.raw;
  }

  private async getSubscriberClient(): Promise<Cluster> {
    if (!this.subscriberClient) {
      this.subscriberClient = await this.redis.createNewClient();
    }
    return this.subscriberClient;
  }

  onModuleDestroy() {
    this.isRunning = false;
    this.subscriberClient?.disconnect();
  }

  // ---------------- UTILS ----------------
  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private timeout(ms: number) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PROCESS TIMEOUT')), ms),
    );
  }

  private parseFields(fields: string[]): Record<string, any> {
    const obj: Record<string, any> = {};

    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];

      try {
        obj[key] = JSON.parse(value);
      } catch {
        obj[key] = value;
      }
    }

    return obj;
  }

  // ---------------- IDEMPOTENCY LOCK ----------------
  private async acquireLock(key: string): Promise<boolean> {
    const res = await this.client.set(
      key,
      '1',
      'EX',
      this.IDEMPOTENT_TTL,
      'NX',
    );

    return res === 'OK';
  }

  // ---------------- PRODUCER ----------------
  async produce(
    stream: string,
    event: AppEvent,
    options?: { maxLen?: number; skipIdempotent?: boolean },
  ): Promise<string> {
    const { maxLen = 10000 } = options || {};

    if (!event?.eventId) throw new Error('eventId required');

    const envelope: AppEvent = {
      ...event,
      version: event.version ?? 1,
      timestamp: event.timestamp ?? Date.now(),
      retryCount: event.retryCount ?? 0,
    };

    const id = await this.client.xadd(
      stream,
      'MAXLEN',
      '~',
      maxLen,
      '*',
      'event',
      JSON.stringify(envelope),
    );

    if (!id) throw new Error('XADD failed');

    this.logger.debug(`[PRODUCE] ${event.eventId} seq=${id}`);

    return id;
  }

  // ---------------- CONSUMER ----------------
  async consume(
    stream: string,
    group: string,
    consumer: string,
    handler: (event: AppEvent, raw: StreamMessage) => Promise<void>,
  ) {
    this.startReclaimLoop(stream, group, consumer, handler);

    while (this.isRunning) {
      try {
        if (this.limit.activeCount > this.MAX_CONCURRENCY * 0.8) {
          await this.sleep(100);
          continue;
        }

        const sub = await this.getSubscriberClient();
        const res = await sub.xreadgroup(
          'GROUP',
          group,
          consumer,
          'COUNT',
          this.MAX_CONCURRENCY,
          'BLOCK',
          5000,
          'STREAMS',
          stream,
          '>',
        );

        if (!res) continue;

        const raw = res as [string, [string, string[]][]][];

        const messages: StreamMessage[] = raw.flatMap(([_, msgs]) =>
          (msgs || []).map(([id, fields]) => ({
            id,
            values: this.parseFields(fields),
          })),
        );

        if (messages.length === 0) continue;

        await this.processBatch(stream, group, consumer, messages, handler);
      } catch (err) {
        this.logger.error(`[CONSUME ERROR]`, err);
        await this.sleep(1000);
      }
    }
  }

  // ---------------- RECLAIM ----------------
  private async startReclaimLoop(
    stream: string,
    group: string,
    consumer: string,
    handler: (event: AppEvent, raw: StreamMessage) => Promise<void>,
  ) {
    let cursor = '0-0';

    while (this.isRunning) {
      try {
        const sub = await this.getSubscriberClient();
        const [nextCursor, messages] = (await sub.xautoclaim(
          stream,
          group,
          consumer,
          this.RECLAIM_IDLE,
          cursor,
          'COUNT',
          this.RECLAIM_COUNT,
        )) as [string, [string, string[]][]];

        cursor = nextCursor;

        if (messages.length > 0) {
          const reclaimed: StreamMessage[] = messages.map(([id, fields]) => ({
            id,
            values: this.parseFields(fields),
          }));

          this.logger.warn(`[RECLAIM] ${reclaimed.length}`);

          await this.processBatch(stream, group, consumer, reclaimed, handler);
        }

        await this.sleep(5000);
      } catch (err) {
        this.logger.error(`[RECLAIM ERROR]`, err);
        await this.sleep(2000);
      }
    }
  }

  // ---------------- BATCH ----------------
  private async processBatch(
    stream: string,
    group: string,
    consumer: string,
    msgs: StreamMessage[],
    handler: (event: AppEvent, raw: StreamMessage) => Promise<void>,
  ) {
    const map = new Map<string, StreamMessage>();
    for (const m of msgs) map.set(m.id, m);

    await Promise.allSettled(
      [...map.values()].map((msg) =>
        this.limit(async () => {
          if (this.processing.has(msg.id)) return;

          this.processing.add(msg.id);

          try {
            await this.processMessage(stream, group, consumer, msg, handler);
          } finally {
            this.processing.delete(msg.id);
          }
        }),
      ),
    );
  }

  // ---------------- PROCESS ----------------
  private async processMessage(
    stream: string,
    group: string,
    consumer: string,
    msg: StreamMessage,
    handler: (event: AppEvent, raw: StreamMessage) => Promise<void>,
  ) {
    let event: AppEvent;

    try {
      const raw = msg.values.event;
      if (!raw) throw new Error('Missing event');

      event = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (err) {
      this.logger.error(`[INVALID EVENT] ${msg.id}`, err);
      await this.client.xack(stream, group, msg.id);
      return;
    }
    const processingKey = `processing:${msg.id}`;
    const doneKey = `done:${msg.id}`;

    const isDone = await this.client.exists(doneKey);
    if (isDone) {
      await this.client.xack(stream, group, msg.id);
      return;
    }

    const locked = await this.client.set(
      processingKey,
      '1',
      'EX',
      Math.ceil(this.PROCESS_TIMEOUT / 1000),
      'NX',
    );

    if (!locked) {
      return;
    }

    const start = Date.now();

    try {
      await Promise.race([
        handler(event, msg),
        this.timeout(this.PROCESS_TIMEOUT),
      ]);
      await this.client.set(doneKey, '1', 'EX', this.IDEMPOTENT_TTL);

      await this.client.xack(stream, group, msg.id);

      this.logger.debug(`[ACK] ${msg.id} ${Date.now() - start}ms`);
    } catch (err) {
      this.logger.error(`[PROCESS FAIL] ${msg.id}`, err);

      await this.handleFailure(stream, group, event, msg, err);
    } finally {
      await this.client.del(processingKey);
    }
  }

  // ---------------- RETRY ----------------
  private async handleFailure(
    stream: string,
    group: string,
    event: AppEvent,
    msg: StreamMessage,
    error: any,
  ) {
    const retry = (event.retryCount || 0) + 1;

    if (retry >= this.MAX_RETRY) {
      await this.sendToDLQ(stream, event, error);
      await this.client.xack(stream, group, msg.id);
      return;
    }

    this.logger.warn(`[RETRY] ${msg.id} -> ${retry}`);
  }

  // ---------------- DLQ ----------------
  private async sendToDLQ(stream: string, event: AppEvent, error: any) {
    const dlq = `${stream}:DLQ`;

    const payload = {
      ...event,
      failedAt: Date.now(),
      error: {
        message: error?.message,
        stack: error?.stack,
      },
    };

    await this.produce(dlq, payload as any, {
      skipIdempotent: true,
    });

    this.logger.error(`[DLQ] ${event.eventId}`);
  }

  // ---------------- GROUP ----------------
  async createGroupIfNotExists(
    streamKey: string,
    groupName: string,
    startId: '0' | '$' = '$',
  ) {
    try {
      await this.client.xgroup(
        'CREATE',
        streamKey,
        groupName,
        startId,
        'MKSTREAM',
      );
    } catch (err: any) {
      if (!err?.message?.includes('BUSYGROUP')) throw err;
    }
  }
}
