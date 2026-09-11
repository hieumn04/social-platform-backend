import { Injectable } from '@nestjs/common';
import { ChannelWrapper, Options } from 'amqp-connection-manager';
import { RabbitMQClient } from './rabbitmq.client';
import { AppLogger } from '../logger/applogger';

@Injectable()
export class RabbitMQPublisher {
  private channel!: ChannelWrapper;
  private useCase!: keyof (typeof this.client)['config']['rabbitmq'];

  constructor(
    private readonly client: RabbitMQClient,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RabbitMQPublisher.name);
  }

  /**
   * Initialize publisher for a specific useCase
   */
  async init(useCase: keyof (typeof this.client)['config']['rabbitmq']) {
    this.useCase = useCase;

    this.channel = await this.client.getOrCreateChannel(useCase);

    this.logger.log(`[Publisher] Initialized → useCase="${useCase}"`);
  }

  /**
   * Publish message to the exchange
   */
  async publish(
    exchange: string,
    routingKey: string,
    message: unknown,
    options?: Options.Publish,
  ) {
    if (!this.channel) {
      throw new Error(
        `[RabbitMQPublisher] Publisher not initialized for useCase="${this.useCase}"`,
      );
    }

    const payload =
      message instanceof Buffer
        ? message
        : Buffer.from(JSON.stringify(message));

    const result = this.channel.publish(exchange, routingKey, payload, {
      persistent: true,
      ...options,
    });

    if (!result) {
      this.logger.warn(
        `[Publisher] Returned false (broker is congested) → exchange=${exchange}, routingKey=${routingKey}`,
      );
    }

    this.logger.debug(
      `[Publisher] Published → exchange="${exchange}", routingKey="${routingKey}"`,
    );
  }
}
