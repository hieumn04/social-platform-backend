import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import {
  ConversationRole,
  ConversationSubtype,
  InboxFolder,
  ReachabilityStatus,
  SystemFolder,
} from '@/shared/enums/roomStatus.enum';

import { ConversationWriteRepository } from '@/modules/coversation/infrastructure/repositories/conversation-write.repository';
import { ConversationParticipantWriteRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant-write.repository';
import { MessageWriteRepository } from '@/modules/message/infrastructure/repositories/message-write.repository';
import { InboxThreadWriteRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread-write.repository';

import { SnowflakeIdGenerator } from '@/shared/snowflake-generator/snowflakeId-generator';
import { getThreadKeyFromUser } from '@/shared/identity/thread-key';

import { MessageRawMapper } from '@/modules/message/infrastructure/mapper/message.raw.mapper';
import { SendMessageInputAdapter } from '@/modules/message/infrastructure/mapper/message.mapper';

import { MessageCreatedEventV1 } from '@/types/events/base.event';
import { RedisStreamService } from '@/shared/redis-cluster/redis-stream.service';

import { SendMessageOutput } from '@/modules/message/application/dtos/send-message.output';
import { SendFirstMessageInput } from '@/modules/message/application/use-cases/send-first-message/send-first-message.input';
import { MessageType } from '@/shared/enums/message.enum';
import { InboxOrderingCacheService } from '@/shared/redis-cluster/conversation/services/inbox-ordering-cache.service';
import { RecentMessageCacheService } from '@/shared/redis-cluster/conversation/services/recent-message-cache.service';

@Injectable()
export class SendFirstMessageUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
    private readonly idGenerator: SnowflakeIdGenerator,
    private readonly conversationWriteRepo: ConversationWriteRepository,
    private readonly participantWriteRepo: ConversationParticipantWriteRepository,
    private readonly messageWriteRepo: MessageWriteRepository,
    private readonly inboxThreadWriteRepo: InboxThreadWriteRepository,
    private readonly redisStreamService: RedisStreamService,
    private readonly inboxOrderingCache: InboxOrderingCacheService,
    private readonly recentMessageCache: RecentMessageCacheService,
  ) {
    this.logger.setContext('SendFirstMessageUseCase');
  }

  async execute(input: SendFirstMessageInput): Promise<SendMessageOutput> {
    const { senderId, sendSlideMessageInput } = input;

    // 🔹 1. Validate
    if (!sendSlideMessageInput.recipient_igids?.length) {
      throw new InternalServerErrorException('Recipient is required');
    }

    const recipientId = sendSlideMessageInput.recipient_igids[0];

    if (recipientId === senderId) {
      throw new InternalServerErrorException('Cannot send message to yourself');
    }

    // 🔥 👉 SINGLE SOURCE OF TRUTH
    const baseInput = SendMessageInputAdapter.fromIG(sendSlideMessageInput);

    // 🔹 2. Generate IDs
    const conversationId = this.idGenerator.nextId();
    const inboxThreadId = this.idGenerator.nextId();
    const generatedMessage = this.idGenerator.nextIdWithTimestamp();
    const ids = {
      conversationId,
      inboxThreadId,
      messageId: generatedMessage.id,
      senderThreadItemId: this.idGenerator.nextId(),
      recipientThreadItemId: this.idGenerator.nextId(),
    };
    const timestampMs = generatedMessage.timestampMs;
    const now = new Date(timestampMs);

    try {
      const t0 = Date.now();

      await this.dataSource.transaction(async (trx: EntityManager) => {
        // 🔹 3. Conversation
        await this.conversationWriteRepo.create(
          {
            conversationId: ids.conversationId,
            subtype: ConversationSubtype.ONE_TO_ONE,
            createdBy: senderId,
          },
          trx,
        );

        // 🔹 4. Participants
        await this.participantWriteRepo.addParticipantsBulk(
          [
            {
              conversationId: ids.conversationId,
              userId: senderId,
              role: ConversationRole.MEMBER,
            },
            {
              conversationId: ids.conversationId,
              userId: recipientId,
              role: ConversationRole.MEMBER,
            },
          ],
          trx,
        );

        // 🔹 5. Message
        const messageDto = MessageRawMapper.mapToInsertMessageDto(baseInput, {
          messageId: ids.messageId,
          threadId: ids.conversationId,
          senderFbid: senderId,
          timestampMs,
        });

        await this.messageWriteRepo.insert(messageDto, trx);

        // 🔹 6. Inbox thread
        const senderKey = getThreadKeyFromUser(senderId).toString();
        const recipientKey = getThreadKeyFromUser(recipientId).toString();

        await this.inboxThreadWriteRepo.upsertWithLastMessageBulk(
          [
            {
              id: ids.senderThreadItemId,
              viewerId: senderId,
              counterpartyUserId: recipientId,
              threadFbid: ids.inboxThreadId,
              conversationId: ids.conversationId,
              threadKey: senderKey,
              threadSubtype: ConversationSubtype.ONE_TO_ONE,
              folder: InboxFolder.PRIMARY,
              systemFolder: SystemFolder.INBOX,
              reachabilityStatus: ReachabilityStatus.REACHABLE,
              displayName: null,
              displayAvatarUrl: null,
              lastMessageId: ids.messageId,
              lastActivityAt: now,
              isSender: true,
            },
            {
              id: ids.recipientThreadItemId,
              viewerId: recipientId,
              counterpartyUserId: senderId,
              threadFbid: ids.inboxThreadId,
              conversationId: ids.conversationId,
              threadKey: recipientKey,
              threadSubtype: ConversationSubtype.ONE_TO_ONE,
              folder: InboxFolder.PRIMARY,
              systemFolder: SystemFolder.INBOX,
              reachabilityStatus: ReachabilityStatus.REACHABLE,
              displayName: null,
              displayAvatarUrl: null,
              lastMessageId: ids.messageId,
              lastActivityAt: now,
              isSender: false,
            },
          ],
          trx,
        );
      });

      this.logger.debug(
        `[PERF_TIMER] DB Transaction took: ${Date.now() - t0}ms`,
      );

      // 🔥 Event dùng cùng source
      const event: MessageCreatedEventV1 = {
        eventId: `${ids.messageId}-v1`,
        type: 'message.created',
        version: 1,
        timestamp: timestampMs,
        data: {
          messageId: ids.messageId,
          conversationId: ids.conversationId,
          senderId,
          recipientId,
          content: baseInput.text,
          clientContext: baseInput.clientMessageId,
          messageType: MessageType.TEXT,
        },
      };

      try {
        const t1 = Date.now();

        await this.redisStreamService.produce('chat:messages', event);

        this.logger.debug(
          `[PERF_TIMER] Redis Stream Dispatch took: ${Date.now() - t1}ms`,
        );

        this.logger.log('Event dispatched', {
          eventId: event.eventId,
        });
      } catch (err) {
        this.logger.error('Stream dispatch failed', {
          error: err,
        });
      }

      // Do not delay realtime fanout on best-effort cache maintenance.
      const cacheInvalidationStartedAt = Date.now();
      void this.recentMessageCache.invalidate(ids.conversationId).then(() => {
        const durationMs = Date.now() - cacheInvalidationStartedAt;
        if (durationMs >= 1000) {
          this.logger.warn('Slow recent-message cache invalidation', {
            conversationId: ids.conversationId,
            durationMs,
          });
        }
      });

      this.logger.log('First message created', {
        senderId,
        recipientId,
        conversationId: ids.conversationId,
        messageId: ids.messageId,
      });

      // 🔥 Cập nhật Redis Inbox Order bất đồng bộ cho cả sender và recipient
      for (const participantId of [senderId, recipientId]) {
        void this.inboxOrderingCache
          .updateInboxOrderOnActivity({
            userId: participantId,
            threadId: ids.inboxThreadId,
            timestampMs,
          })
          .catch((err) =>
            this.logger.warn(
              '[FirstMsg] Failed to update inbox order for participant',
              {
                error: err,
                participantId,
              },
            ),
          );
      }

      return new SendMessageOutput(
        true,
        'Message sent successfully',
        ids.conversationId,
        ids.messageId,
        timestampMs,
        baseInput.clientMessageId,
      );
    } catch (error) {
      this.logger.error('Failed to send first message', {
        error,
        senderId,
        recipientId,
      });

      throw new InternalServerErrorException('Failed to send message');
    }
  }
}
