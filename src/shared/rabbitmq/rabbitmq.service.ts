import { Injectable } from '@nestjs/common';
import { RabbitMQClient } from './rabbitmq.client';
import { RabbitMQPublisher } from './rabbitmq.publisher';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { AppLogger } from '../logger/applogger';

@Injectable()
export class RabbitMQService {
  constructor(
    private readonly client: RabbitMQClient,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RabbitMQService.name);
  }

  /**
   * Create & init a Publisher for a specific useCase
   */
  async createPublisher(
    useCase: keyof (typeof this.client)['config']['rabbitmq'],
  ): Promise<RabbitMQPublisher> {
    if (!this.client) {
      this.logger.error(
        `[RabbitMQService] Cannot create publisher → client not connected`,
      );
      throw new Error(
        `RabbitMQ client is not connected. Publisher cannot be created.`,
      );
    }
    const publisher = new RabbitMQPublisher(this.client, this.logger);
    await publisher.init(useCase);

    this.logger.debug(
      `[RabbitMQService] Publisher ready → useCase="${useCase}"`,
    );

    return publisher;
  }

  /**
   * Create & init a Consumer for a specific useCase
   */
  async createConsumer(
    useCase: keyof (typeof this.client)['config']['rabbitmq'],
  ): Promise<RabbitMQConsumer> {
    const consumer = new RabbitMQConsumer(this.client, this.logger);
    await consumer.init(useCase);

    this.logger.debug(
      `[RabbitMQService] Consumer ready → useCase="${useCase}"`,
    );

    return consumer;
  }
}
