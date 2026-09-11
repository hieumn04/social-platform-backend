import { SendChatEventUseCase } from '@/application/orchestrators/usecases/send-chat-event/send-chat-event.usecase';

import { LoggerModule } from '@/shared/logger/logger.module';
import { RabbitMQModule } from '@/shared/rabbitmq/rabbitmq.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [RabbitMQModule, LoggerModule],
  providers: [SendChatEventUseCase],
  exports: [SendChatEventUseCase],
})
export class SendChatEventModule {}
