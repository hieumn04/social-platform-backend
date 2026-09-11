// src/rabbitmq/rabbitmq.client.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  connect,
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { Channel } from 'amqplib';
import { NestConfigService } from '../config/config.service';
import { RabbitMQUseCaseConfig } from '@/types/rabbitmq/rabbitmq.types';
import { AppLogger } from '../logger/applogger';

const DEFAULT_HEARTBEAT = 8; // seconds
const DEFAULT_RECONNECT = 5; // seconds
const WAIT_FOR_CONNECT_TIMEOUT = 20000; // ms

@Injectable()
export class RabbitMQClient implements OnModuleDestroy {
  private connections = new Map<string, AmqpConnectionManager>();
  private channels = new Map<string, ChannelWrapper>();

  constructor(
    private readonly config: NestConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RabbitMQClient.name);
  }

  /**
   * helper: promise timeout
   */
  private async withTimeout<T>(p: Promise<T>, ms: number, msg?: string) {
    return Promise.race([
      p,
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error(msg ?? `Timeout ${ms}ms`)), ms),
      ),
    ]) as Promise<T>;
  }

  /**
   * Get or create channel for a useCase (key = exchange)
   *
   * 🚫 NO assert exchange/queue — Docker created already
   * 🚀 Auto reconnect + auto channel restart
   */
  async getOrCreateChannel(
    useCase: keyof typeof this.config.rabbitmq,
  ): Promise<ChannelWrapper> {
    const cfg: RabbitMQUseCaseConfig = this.config.rabbitmq[useCase];
    if (!cfg) {
      throw new Error(
        `RabbitMQ config for useCase "${String(useCase)}" not found`,
      );
    }

    const key = cfg.exchange;

    // ------------------------------
    // 🔥 STEP 1: CREATE CONNECTION
    // ------------------------------
    if (!this.connections.has(key)) {
      this.logger.log(`[RMQ] Creating connection for ${key} → ${cfg.uri}`);

      const conn = connect([cfg.uri], {
        heartbeatIntervalInSeconds: DEFAULT_HEARTBEAT,
        reconnectTimeInSeconds: DEFAULT_RECONNECT,
      });

      // Khi connection manager bắt đầu thử kết nối
      conn.on('connecting', () => {
        this.logger.log(`[RMQ] (connecting...) → ${key}`);
      });

      // Khi đã kết nối thành công
      conn.on('connect', ({ url }) => {
        this.logger.log(
          `[RMQ] CONNECTED → ${key} | URL: ${typeof url === 'string' ? url : ((url as any)?.url ?? 'unknown')}`,
        );
      });

      // Khi lỗi
      conn.on('disconnect', (params) => {
        const err = (params as any)?.err ?? params;
        this.logger.error(`[RMQ] DISCONNECTED → ${key} | Error:`, err);
      });

      this.connections.set(key, conn);
    }

    const conn = this.connections.get(key)!;

    // ------------------------------
    // 🔥 STEP 2: CREATE CHANNEL
    // ------------------------------
    if (!this.channels.has(key)) {
      this.logger.log(`[RMQ] Creating channel for ${key}...`);

      const channel = conn.createChannel({
        json: false,
        setup: async (ch: Channel) => {
          this.logger.log(
            `[RMQ] Setting up channel for exchange ${cfg.exchange}`,
          );

          try {
            await ch.assertExchange(cfg.exchange, cfg.exchangeType, {
              durable: true,
            });

            this.logger.log(
              `[RMQ] Exchange OK → ${cfg.exchange} (${cfg.exchangeType})`,
            );
          } catch (e) {
            this.logger.error(
              `[RMQ] Exchange assert FAILED → ${cfg.exchange}: ${(e as any).message}`,
            );
          }
        },
      });

      // Test connect với timeout
      try {
        this.logger.log(`[RMQ] Waiting for channel.connect() → ${key}`);
        await this.withTimeout(
          channel.waitForConnect(),
          WAIT_FOR_CONNECT_TIMEOUT,
          `Channel connect timeout → ${key}`,
        );

        this.logger.log(`[RMQ] Channel READY → ${key}`);
      } catch (err) {
        this.logger.error(
          `[RMQ] Channel connect FAILED (${key}): ${(err as any).message}`,
        );
      }

      // Debug lỗi channel
      channel.on('error', (err) => {
        this.logger.error(`[RMQ] Channel ERROR (${key}):`, {
          error: err,
        });
      });

      this.channels.set(key, channel);
    }

    // ------------------------------
    // 🔥 STEP 3: RETURN CHANNEL
    // ------------------------------
    const chWrapper = this.channels.get(key)!;

    if (!chWrapper) {
      throw new Error(`[RMQ] Failed to get channel wrapper → ${key}`);
    }

    this.logger.log(`[RMQ] getOrCreateChannel() → SUCCESS for ${key}`);
    return chWrapper;
  }

  /**
   * Throw if channel not exist
   */
  getChannel(exchange: string): ChannelWrapper {
    const ch = this.channels.get(exchange);
    if (!ch)
      throw new Error(
        `[RabbitMQ] Channel for exchange "${exchange}" not found`,
      );
    return ch;
  }

  getQueuePrefetch(
    useCase: keyof typeof this.config.rabbitmq,
    queueName: string,
  ): number {
    const cfg = this.config.rabbitmq[useCase];
    const queueCfg = cfg.queues.find((q) => q.name === queueName);
    if (!queueCfg) {
      this.logger.warn(
        `[RabbitMQClient] Queue "${queueName}" not found in useCase "${String(useCase)}", fallback prefetch=1`,
      );
    }
    return queueCfg?.prefetch ?? 1;
  }

  /**
   * Graceful shutdown
   */
  async onModuleDestroy() {
    this.logger.log(
      '[RabbitMQ] Shutdown initiated → closing channels & connections...',
    );

    for (const [key, ch] of this.channels.entries()) {
      try {
        await ch.close();
        this.logger.log(`[RabbitMQ] Channel closed → ${key}`);
      } catch (err) {
        this.logger.warn(
          `[RabbitMQ] Error closing channel ${key}: ${(err as any).message}`,
        );
      }
    }
    this.channels.clear();

    for (const [key, conn] of this.connections.entries()) {
      try {
        await conn.close();
        this.logger.log(`[RabbitMQ] Connection closed → ${key}`);
      } catch (err) {
        this.logger.warn(
          `[RabbitMQ] Error closing connection ${key}: ${(err as any).message}`,
        );
      }
    }
    this.connections.clear();
  }
}
