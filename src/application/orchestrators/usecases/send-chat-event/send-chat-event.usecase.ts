import { SendChatEventInput } from '@/application/orchestrators/usecases/send-chat-event/send-chat-event.input';
import { SendChatEventOutput } from '@/application/orchestrators/usecases/send-chat-event/send-chat-event.output';
import { AppLogger } from '@/shared/logger/applogger';
import { RabbitMQService } from '@/shared/rabbitmq/rabbitmq.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SendChatEventUseCase {
  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SendChatEventUseCase.name);
  }

  async execute(input: SendChatEventInput): Promise<SendChatEventOutput> {
    this.logger.debug(` Start sending event → messageId=${input.messageId}`);

    const publisher = await this.rabbit.createPublisher('chat.1on1');

    const payload = {
      event: 'chat.message.sent',
      messageId: input.messageId,
      roomId: input.roomId,
      senderId: input.senderId,
      receiverId: input.receiverId,
      content: input.content,
      createdAt: input.createdAt,
    };

    await publisher.publish('chat.1on1.exchange', 'chat.1on1', payload);

    this.logger.log(` Event sent successfully → messageId=${input.messageId}`);

    return {
      success: true,
      message: 'Event sent successfully',
      messageId: input.messageId,
    };
  }
}
