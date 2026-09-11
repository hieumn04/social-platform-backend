import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';

import { InboxThreadWriteRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread-write.repository';
import { ConversationWatermarksRepository } from '@/modules/coversation/infrastructure/repositories/conversation-watermarks.repository';
import { EventRouter } from '@/shared/event-router/event-router';
import { AppLogger } from '@/shared/logger/applogger';
import {
  RedisStreamService,
  StreamMessage,
} from '@/shared/redis-cluster/redis-stream.service';
import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';
import {
  AppEvent,
  ConversationReadWatermarkUpdatedEventV1,
} from '@/types/events/base.event';

@Injectable()
export class ReadWatermarkWorker
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly STREAM_KEY = WsRedisKeys.readWatermarkStreamKey();
  private readonly GROUP_NAME = 'conversation-read-watermark-worker-group';
  private readonly CONSUMER_NAME = `read-watermark-worker-${process.pid}`;
  private readonly router = new EventRouter();

  constructor(
    private readonly streamService: RedisStreamService,
    private readonly logger: AppLogger,
    private readonly watermarkRepo: ConversationWatermarksRepository,
    private readonly inboxThreadWriteRepo: InboxThreadWriteRepository,
  ) {
    this.logger.setContext(ReadWatermarkWorker.name);
    this.router.register(
      'conversation.read_watermark_updated',
      this.handleReadWatermarkUpdated.bind(this),
    );
  }

  async onModuleInit() {
    await this.streamService.createGroupIfNotExists(
      this.STREAM_KEY,
      this.GROUP_NAME,
    );

    void this.streamService.consume(
      this.STREAM_KEY,
      this.GROUP_NAME,
      this.CONSUMER_NAME,
      this.handleMessage.bind(this),
    );
  }

  async onApplicationShutdown() {
    this.logger.log(`Worker ${this.CONSUMER_NAME} shutting down`);
  }

  private async handleMessage(event: AppEvent, raw: StreamMessage) {
    await this.router.route(event, raw);
  }

  private async handleReadWatermarkUpdated(
    event: ConversationReadWatermarkUpdatedEventV1,
  ) {
    const {
      conversationId,
      participantId,
      threadFbid,
      readTimestampMs,
    } = event.data;

    await this.watermarkRepo.advanceReadWatermark(
      conversationId,
      participantId,
      readTimestampMs,
    );

    await this.inboxThreadWriteRepo.markAsReadThrough(
      participantId,
      threadFbid,
      event.data.messageId,
    );
  }
}
