import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
  Inject,
} from '@nestjs/common';
import {
  RedisStreamService,
  StreamMessage,
} from '@/shared/redis-cluster/redis-stream.service';
import { AppLogger } from '@/shared/logger/applogger';
import { MessageFanout } from '@/modules/message/application/port/message-fanout.port';
import { Message } from '@/modules/message/domain/models/messages.model';
import { MessageType, MailboxEventType } from '@/shared/enums/message.enum';
import { EventRouter } from '@/shared/event-router/event-router';
import {
  AppEvent,
  ExtractEventData,
  MessageCreatedEventV1,
} from '@/types/events/base.event';
import { ConversationCacheService } from '@/shared/redis-cluster/conversation/coversation-cache-service';
import { ConversationParticipantRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant.repository';
import { MessageWriteRepository } from '@/modules/message/infrastructure/repositories/message-write.repository';
import { TypeormMailboxEventRepository } from '@/modules/mailbox/infrastructure/repositories/typeorm-mailbox-event.repository';
import { WatermarkCacheService } from '@/shared/redis-cluster/conversation/services/watermark-cache.service';
import { ConversationWatermarksRepository } from '@/modules/coversation/infrastructure/repositories/conversation-watermarks.repository';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { WsEmitter } from '@/modules/chat/application/ports/ws-emitter';
import { randomUUID } from 'crypto';

@Injectable()
export class ProductionMessageWorker
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly STREAM_KEY = 'chat:messages';
  private readonly GROUP_NAME = 'chat:worker-group';
  private readonly CONSUMER_NAME = `worker-${process.pid}`;
  private readonly router = new EventRouter();

  constructor(
    private readonly streamService: RedisStreamService,
    private readonly logger: AppLogger,
    private readonly conversationCacheService: ConversationCacheService,
    private readonly participantRepo: ConversationParticipantRepository,
    private readonly messageWriteRepo: MessageWriteRepository,
    private readonly mailboxEventRepo: TypeormMailboxEventRepository,
    private readonly watermarkCache: WatermarkCacheService,
    private readonly watermarkRepo: ConversationWatermarksRepository,
    private readonly threadRepo: TypeormInboxThreadRepository,
    @Inject('WsEmitter') private readonly wsEmitter: WsEmitter,
    @Inject('MessageFanout') private readonly fanoutService: MessageFanout,
  ) {
    this.logger.setContext(ProductionMessageWorker.name);
    // Register business logic handlers
    this.router.register(
      'message.created',
      this.handleMessageCreated.bind(this),
    );
  }

  async onModuleInit() {
    await this.streamService.createGroupIfNotExists(
      this.STREAM_KEY,
      this.GROUP_NAME,
    );
    this.logger.log(`Starting worker ${this.CONSUMER_NAME}...`);

    // We don't block the startup sequence
    void this.streamService.consume(
      this.STREAM_KEY,
      this.GROUP_NAME,
      this.CONSUMER_NAME,
      this.handleMessage.bind(this),
    );
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(
      `Worker ${this.CONSUMER_NAME} shutting down due to ${signal}`,
    );
  }

  /* ============================================================
   * STEP 1 — ENTRY POINT
   * Delegates to EventRouter which validates event type/version
   * and forwards raw so handlers can access seq = raw.id
   * ============================================================ */
  private async handleMessage(event: AppEvent, raw: StreamMessage) {
    try {
      this.logger.debug(`[CONSUMED] eventId=${event.eventId} seq=${raw.id}`);

      // EventRouter validates type + version, then calls the registered handler
      // raw is forwarded through so every handler receives seq = raw.id
      await this.router.route(event, raw);
    } catch (err: any) {
      this.logger.error(`[WORKER] Routing failed seq=${raw.id}`, {
        error: err.message,
      });
      throw err; // Re-throw so RedisStreamService can retry / DLQ
    }
  }

  private async handleMessageCreated(
    event: MessageCreatedEventV1,
    raw: StreamMessage,
  ): Promise<void> {
    const data: ExtractEventData<MessageCreatedEventV1> = event.data;

    const targetUsers = await this.resolveParticipants(data);

    if (targetUsers.length === 0) {
      this.logger.warn('[WORKER] No participants resolved — dropping event', {
        conversationId: data.conversationId,
        messageId: data.messageId,
      });
      return;
    }

    const seq = raw.id;

    await this.mailboxEventRepo.insertEvents(
      targetUsers.map((userId) => ({
        userId,
        seq,
        threadId: data.conversationId,
        eventType: MailboxEventType.MESSAGE_CREATED,
        messageId: data.messageId,
        actorId: data.senderId,
        createdAt: event.timestamp,
      })),
    );

    this.logger.debug(
      `[WORKER] Persisted seq=${seq} for ${targetUsers.length} users`,
    );

    const msgObj = Message.restore(data.messageId, {
      conversationId: data.conversationId,
      clientMessageId: data.clientContext,
      senderId: data.senderId,
      content: data.content ?? '',
      type: data.messageType || MessageType.TEXT,
      payload: data.payload,
      isDeleted: false,
      createdAt: new Date(event.timestamp),
      updatedAt: new Date(event.timestamp),
    });

    void this.fanoutService.fanout(
      msgObj,
      targetUsers,
      data.clientContext,
      seq,
    );

    this.emitInboxUpdated(targetUsers, data.conversationId);

    // Update delivery watermarks for all recipients (except sender) asynchronously
    void this.advanceDeliveryWatermarks(
      data.conversationId,
      targetUsers,
      data.senderId,
      event.timestamp,
    );

    /* ----------------------------------------------------------
     * STEP 6 — XACK
     * Handled automatically by RedisStreamService after this
     * handler returns without throwing.
     * ---------------------------------------------------------- */
    this.logger.debug(`[WORKER] Flow complete seq=${seq}`);
  }

  /* ============================================================
   * HELPER — Advance delivery watermarks for all recipients
   * ============================================================ */
  private async advanceDeliveryWatermarks(
    conversationId: string,
    targetUsers: string[],
    senderId: string,
    timestamp: number,
  ): Promise<void> {
    const recipients = targetUsers.filter((userId) => userId !== senderId);
    if (recipients.length === 0) return;

    const timestampMs = String(timestamp);

    for (const recipientId of recipients) {
      // Execute each recipient's update concurrently and handle errors gracefully
      void (async () => {
        try {
          // 1. Cold path: Persist to DB (always use conversationId as the primary key in DB)
          await this.watermarkRepo.advanceDeliveryWatermark(
            conversationId,
            recipientId,
            timestampMs,
          );

          // 2. Hot path: Resolve threadFbid for Redis cache
          const threadFbid =
            await this.threadRepo.getThreadFbidByConversationIdAndViewerId(
              conversationId,
              recipientId,
            );

          if (threadFbid) {
            await this.watermarkCache.advanceDelivery(
              threadFbid,
              recipientId,
              timestampMs,
            );
          }
        } catch (err: any) {
          this.logger.error(
            `[WORKER] Failed to advance delivery watermark for recipient ${recipientId} in conv ${conversationId}`,
            err,
          );
        }
      })();
    }
  }

  /* ============================================================
   * HELPER — Resolve participants (cache → DB fallback)
   * ============================================================ */
  private async resolveParticipants(
    data: ExtractEventData<MessageCreatedEventV1>,
  ): Promise<string[]> {
    if (data.recipientId) {
      const users = [data.senderId, data.recipientId];

      await this.conversationCacheService.setParticipants(
        data.conversationId,
        users,
      );

      return users;
    }

    let users = await this.conversationCacheService.getParticipants(
      data.conversationId,
    );

    if (!users?.length) {
      const participants =
        await this.participantRepo.getParticipantsByConversationId(
          data.conversationId,
        );

      users = participants.map((p) => p.user_id);

      if (users.length) {
        await this.conversationCacheService.setParticipants(
          data.conversationId,
          users,
        );
      }
    }

    return users || [];
  }

  private emitInboxUpdated(
    participantIds: string[],
    conversationId: string,
  ): void {
    const payload = {
      eventId: randomUUID(),
      timestamp: Date.now(),
      conversationId,
      updatedAt: Date.now(),
      participantIds,
    };

    for (const userId of participantIds) {
      this.wsEmitter.emitToRoom(`user:${userId}`, 'inbox:update', payload);
    }
  }
}
