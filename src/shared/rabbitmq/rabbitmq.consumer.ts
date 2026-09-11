import { Injectable } from '@nestjs/common';
import { ChannelWrapper, Channel } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { RabbitMQClient } from './rabbitmq.client';
import { AppLogger } from '../logger/applogger';
import { error } from 'console';

export type MessageCallback<T> = (payload: T, msg: ConsumeMessage) => void;

@Injectable()
export class RabbitMQConsumer {
  private channel!: ChannelWrapper;
  private useCase!: keyof (typeof this.client)['config']['rabbitmq'];

  constructor(
    private readonly client: RabbitMQClient,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RabbitMQConsumer.name);
  }

  /**
   * Initialize consumer for specific useCase
   */
  async init(useCase: keyof (typeof this.client)['config']['rabbitmq']) {
    this.useCase = useCase;

    this.channel = await this.client.getOrCreateChannel(useCase);

    this.logger.log(`[Consumer] Initialized → useCase="${useCase}"`);
  }

  /**
   * Consume RabbitMQ queue
   */
  async consume<T = any>(queue: string, callback: MessageCallback<T>) {
    if (!this.channel) {
      throw new Error(
        `[RabbitMQConsumer] Consumer not initialized for useCase="${this.useCase}"`,
      );
    }

    const prefetch = this.client.getQueuePrefetch(this.useCase, queue);

    await this.channel.addSetup(async (ch: Channel) => {
      await ch.prefetch(prefetch);

      await ch.consume(queue, (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString()) as T;

          callback(payload, msg);

          ch.ack(msg);

          this.logger.debug(
            `[Consumer] ACK → queue="${queue}", size=${msg.content.length}`,
          );
        } catch (err: unknown) {
          this.logger.error(
            `[Consumer] Error processing message from "${queue}"`,
            { error: err },
          );
          ch.nack(msg, false, true);
        }
      });

      this.logger.log(`[Consumer] Listening → queue="${queue}"`);
    });
  }
}
