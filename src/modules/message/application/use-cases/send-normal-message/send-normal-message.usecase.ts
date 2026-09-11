import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import { MessageWriteRepository } from '@/modules/message/infrastructure/repositories/message-write.repository';
import { InboxThreadWriteRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread-write.repository';
import { SnowflakeIdGenerator } from '@/shared/snowflake-generator/snowflakeId-generator';
import { MessageRawMapper } from '@/modules/message/infrastructure/mapper/message.raw.mapper';
import { RedisStreamService } from '@/shared/redis-cluster/redis-stream.service';
import { MessageCreatedEventV1 } from '@/types/events/base.event';
import { SendMessageOutput } from '@/modules/message/application/dtos/send-message.output';
import { ConversationCacheService } from '@/shared/redis-cluster/conversation/coversation-cache-service';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { SendMessageInput } from '@/modules/message/application/use-cases/send-normal-message/send-message.input';
import { SendMessageInputAdapter } from '@/modules/message/infrastructure/mapper/message.mapper';
import { ConversationParticipantRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant.repository';
import { InboxOrderingCacheService } from '@/shared/redis-cluster/conversation/services/inbox-ordering-cache.service';
import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { RecentMessageCacheService } from '@/shared/redis-cluster/conversation/services/recent-message-cache.service';
import { MessageContentPreparationService } from '@/modules/message/application/services/message-content-preparation.service';
import { MessageMediaRepository } from '@/modules/message/infrastructure/repositories/message-media.repository';

@Injectable()
export class SendNormalMessageUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
    private readonly idGenerator: SnowflakeIdGenerator,
    private readonly messageWriteRepo: MessageWriteRepository,
    private readonly inboxThreadWriteRepo: InboxThreadWriteRepository,
    private readonly inboxRepo: TypeormInboxThreadRepository,
    private readonly redisStreamService: RedisStreamService,
    private readonly cache: ConversationCacheService,
    private readonly participantRepo: ConversationParticipantRepository,
    private readonly inboxOrderingCache: InboxOrderingCacheService,
    private readonly redis: RedisClusterService,
    private readonly recentMessageCache: RecentMessageCacheService,
    private readonly contentPreparation: MessageContentPreparationService,
    private readonly mediaRepo: MessageMediaRepository,
  ) {
    this.logger.setContext('SendNormalMessageUseCase');
  }

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    const { senderId, sendSlideMessageWAttribute } = input;

    const threadFbid = sendSlideMessageWAttribute.ig_thread_igid;
    if (!threadFbid) {
      throw new InternalServerErrorException('ig_thread_igid is required');
    }

    // Use the same monotonic logical timestamp as the Snowflake id. A host or
    // Docker clock rollback must not make a newer message look older, skip the
    // inbox update, or force the client into a delayed retry loop.
    const generatedMessage = this.idGenerator.nextIdWithTimestamp();
    const timestampMs = generatedMessage.timestampMs;
    const now = new Date(timestampMs);
    const messageId = generatedMessage.id;

    // 🔥 SINGLE SOURCE
    // 🔹 resolve conversation
    let conversationId = await this.cache.getConversationId(threadFbid);
    if (!conversationId) {
      conversationId =
        await this.inboxRepo.getConversationIdByViewerAndThreadFbId(
          senderId,
          threadFbid,
        );

      if (!conversationId) {
        throw new NotFoundException('conversation_id not found');
      }

      await this.cache.setConversationId(threadFbid, conversationId);
    }

    const existingMessage = await this.messageWriteRepo.findByClientContext(
      conversationId,
      sendSlideMessageWAttribute.offline_threading_id,
    );
    if (existingMessage) {
      return new SendMessageOutput(
        true,
        'Message already sent',
        conversationId,
        existingMessage.messageId,
        existingMessage.timestampMs,
        sendSlideMessageWAttribute.offline_threading_id,
      );
    }

    const prepared = await this.contentPreparation.prepare(
      senderId,
      conversationId,
      sendSlideMessageWAttribute,
    );
    const baseInput = SendMessageInputAdapter.fromIG(
      sendSlideMessageWAttribute,
    );
    baseInput.contentType = prepared.contentType;
    baseInput.text = prepared.text;
    baseInput.snippet = prepared.snippet;
    baseInput.payload = prepared.payload;

    try {
      const t0 = Date.now();
      let inserted = true;
      let persistedMessageId = messageId;
      let persistedTimestampMs = timestampMs;

      await this.dataSource.transaction(async (trx: EntityManager) => {
        // 🔹 insert message
        const messageDto = MessageRawMapper.mapToInsertMessageDto(baseInput, {
          messageId,
          threadId: conversationId,
          senderFbid: senderId,
          timestampMs,
        });

        const insertResult = await this.messageWriteRepo.insert(
          messageDto,
          trx,
        );
        inserted = insertResult.inserted;
        persistedMessageId = insertResult.messageId;
        persistedTimestampMs = insertResult.timestampMs;

        if (inserted && prepared.uploads.length) {
          await this.mediaRepo.attachUploads(messageId, prepared.uploads, trx);
        }

        // 🔹 update thread
        if (inserted) {
          await this.inboxThreadWriteRepo.updateLastMessageByThread(
            threadFbid,
            messageId,
            now,
            senderId,
            trx,
          );
        }
      });

      if (!inserted) {
        return new SendMessageOutput(
          true,
          'Message already sent',
          conversationId,
          persistedMessageId,
          persistedTimestampMs,
          baseInput.clientMessageId,
        );
      }

      this.logger.debug(
        `[PERF_TIMER] DB Transaction took: ${Date.now() - t0}ms`,
      );

      // The transaction is committed at this point. Advancing the generation
      // makes every cached latest-page key from before this message obsolete.
      // 🔥 Cập nhật Redis Cache-First Inbox Order bất đồng bộ (non-blocking)
      void this.updateInboxCacheAndOrder({
        conversationId,
        threadFbid,
        senderId,
        timestampMs,
        lastMessageId: messageId,
      }).catch((err) =>
        this.logger.warn('Failed to update inbox cache in background', {
          error: err,
        }),
      );

      // 🔥 Event dùng baseInput
      const deliveryPayload =
        await this.contentPreparation.hydratePayloadForDelivery(
          prepared.contentType,
          prepared.payload,
        );
      const event: MessageCreatedEventV1 = {
        eventId: `${messageId}-v1`,
        type: 'message.created',
        version: 1,
        timestamp: timestampMs,
        data: {
          messageId,
          conversationId,
          senderId,
          content: prepared.text,
          clientContext: baseInput.clientMessageId,
          sendAttribution: sendSlideMessageWAttribute.send_attribution, // giữ lại vì Base chưa có
          messageType: prepared.contentType,
          payload: deliveryPayload,
        },
      };

      const streamDispatchStartedAt = Date.now();
      try {
        await this.redisStreamService.produce('chat:messages', event);
        this.logger.debug(
          `[PERF_TIMER] Redis Stream Dispatch took: ${Date.now() - streamDispatchStartedAt}ms`,
        );
      } catch (err) {
        this.logger.error('Stream dispatch failed', { error: err });
      }

      // Cache maintenance must not sit on the realtime delivery path. During
      // a Redis node reconnect this operation can take tens of seconds, while
      // the committed message event still needs to reach socket clients now.
      const cacheInvalidationStartedAt = Date.now();
      void this.recentMessageCache.invalidate(conversationId).then(() => {
        const durationMs = Date.now() - cacheInvalidationStartedAt;
        if (durationMs >= 1000) {
          this.logger.warn('Slow recent-message cache invalidation', {
            conversationId,
            durationMs,
          });
        }
      });

      return new SendMessageOutput(
        true,
        'Message sent successfully',
        conversationId,
        messageId,
        timestampMs,
        baseInput.clientMessageId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Failed to send message', {
        error,
        senderId,
        threadFbid,
      });

      throw new InternalServerErrorException('Failed to send message');
    }
  }

  private async updateInboxCacheAndOrder(params: {
    conversationId: string;
    threadFbid: string;
    senderId: string;
    timestampMs: number;
    lastMessageId: string;
  }): Promise<void> {
    const { conversationId, threadFbid, senderId, timestampMs, lastMessageId } =
      params;

    // 1. Lấy danh sách participants
    let participants = await this.cache.getParticipants(threadFbid);
    if (!participants || !participants.length) {
      const dbParticipants =
        await this.participantRepo.getParticipantsByConversationId(
          conversationId,
        );
      participants = dbParticipants.map((p) => p.user_id);
      if (participants.length) {
        await this.cache.setParticipants(threadFbid, participants);
      }
    }

    // 2. Cập nhật thứ tự inbox của từng participant dùng Lua script (1 RTT)
    await Promise.all(
      participants.map((userId) =>
        this.inboxOrderingCache.updateInboxOrderOnActivity({
          userId,
          threadId: threadFbid,
          timestampMs,
        }),
      ),
    );

    // 3. Cập nhật HASH summary
    const summaryKey = WsRedisKeys.threadSummaryKey(threadFbid);
    const summaryExists = await this.redis.raw.exists(summaryKey);
    if (summaryExists) {
      await this.redis.raw.hset(summaryKey, {
        last_message_id: lastMessageId,
        last_activity_at: timestampMs.toString(),
      });
    } else {
      const dbThread = await this.inboxRepo.findByViewerAndThreadFbId(
        senderId,
        threadFbid,
      );
      if (dbThread) {
        await this.inboxOrderingCache.setThreadSummary(threadFbid, dbThread);
      }
    }
  }
}
