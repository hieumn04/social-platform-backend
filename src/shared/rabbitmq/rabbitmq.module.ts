import { Module } from '@nestjs/common';
import { RabbitMQClient } from './rabbitmq.client';
import { RabbitMQPublisher } from './rabbitmq.publisher';

import { RabbitMQConsumer } from './rabbitmq.consumer';
import { ConfigModule } from '../config/config.module';
import { RabbitMQService } from './rabbitmq.service';
import { LoggerModule } from '@/shared/logger/logger.module';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    RabbitMQClient,
    RabbitMQPublisher,
    RabbitMQConsumer,
    RabbitMQService,
  ],
  exports: [
    RabbitMQClient,
    RabbitMQPublisher,
    RabbitMQConsumer,
    RabbitMQService,
  ],
})
export class RabbitMQModule {}
