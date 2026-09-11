import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { WsEmitter } from '@/modules/chat/application/ports/ws-emitter';
import { ConversationParticipantRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant.repository';
import { InboxThreadWriteRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread-write.repository';
import { ConversationWatermarksRepository } from '@/modules/coversation/infrastructure/repositories/conversation-watermarks.repository';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { MessageRepositoryRaw } from '@/modules/message/infrastructure/repositories/message.repository';
import { AppLogger } from '@/shared/logger/applogger';
import { ConversationCacheService } from '@/shared/redis-cluster/conversation/coversation-cache-service';
import { WatermarkCacheService } from '@/shared/redis-cluster/conversation/services/watermark-cache.service';
import { WsRedisKeys } from '@/shared/redis-cluster/redis-keys/ws.redis-keys';
import { RedisStreamService } from '@/shared/redis-cluster/redis-stream.service';
import { ConversationReadWatermarkUpdatedEventV1 } from '@/types/events/base.event';
import { UnreadStateVersionService } from '@/shared/redis-cluster/unread-state-version.service';

export interface MarkSeenInput {
  threadFbid: string;
  messageId: string;
  messageTimestampMs: string;
  viewerId: string;
}

export interface MarkSeenOutput {
  participant_fbid: string;
  watermark_timestamp_ms: string;
  watermark_message_id: string;
  thread_unread: boolean;
  unread_thread_count: number;
  unread_state_seq: string;
}

@Injectable()
export class MarkSeenUseCase {
  constructor(
    private readonly logger: AppLogger,
    private readonly watermarkCache: WatermarkCacheService,
    private readonly watermarkRepo: ConversationWatermarksRepository,
    private readonly conversationCache: ConversationCacheService,
    private readonly inboxRepo: TypeormInboxThreadRepository,
    private readonly inboxThreadWriteRepo: InboxThreadWriteRepository,
    private readonly participantRepo: ConversationParticipantRepository,
    private readonly messageRepo: MessageRepositoryRaw,
    private readonly streamService: RedisStreamService,
    private readonly unreadStateVersion: UnreadStateVersionService,
    @Inject('WsEmitter') private readonly wsEmitter: WsEmitter,
  ) {
    this.logger.setContext(MarkSeenUseCase.name);
  }

  async execute(input: MarkSeenInput): Promise<MarkSeenOutput> {
    const { threadFbid, messageId, messageTimestampMs, viewerId } = input;

    if (!threadFbid || !messageId || !viewerId) {
      throw new BadRequestException(
        'threadFbid, messageId, and viewerId are required',
      );
    }

    let conversationId = await this.conversationCache.getConversationId(threadFbid);

    if (!conversationId) {
      conversationId = await this.inboxRepo.getConversationIdByViewerAndThreadFbId(
        viewerId,
        threadFbid,
      );

      if (!conversationId) {
        throw new BadRequestException('Thread not found');
      }

      void this.conversationCache
        .setConversationId(threadFbid, conversationId)
        .catch((err) => this.logger.warn('setConversationId failed', { error: err }));
    }

    const message = await this.messageRepo.findMessageInThread(
      conversationId,
      messageId,
    );

    if (!message) {
      throw new BadRequestException('Message not found in thread');
    }

    const resolvedTimestampMs = String(message.timestamp_ms);

    if (messageTimestampMs && messageTimestampMs !== resolvedTimestampMs) {
      this.logger.warn(
        'markSeen timestamp mismatch, using persisted message timestamp',
        {
          threadFbid,
          messageId,
          viewerId,
          clientTimestampMs: messageTimestampMs,
          resolvedTimestampMs,
        },
      );
    }

    const updated = await this.watermarkCache.advanceRead(
      threadFbid,
      viewerId,
      resolvedTimestampMs,
    );
    const currentWatermark =
      updated
        ? resolvedTimestampMs
        : (
            await this.watermarkCache.getOne(threadFbid, viewerId)
          ).readWatermarkTimestampMs;
    const shouldPublishSeenUpdate = updated || currentWatermark === resolvedTimestampMs;

    // Clear the inbox flag only when no newer message exists. This prevents an
    // older mark-read request from racing with a newly committed message.
    await this.inboxThreadWriteRepo.markAsReadThrough(
      viewerId,
      threadFbid,
      messageId,
    );

    const unreadStateSeq = await this.unreadStateVersion.next(viewerId);
    const unreadSnapshot = await this.inboxRepo.getUnreadThreadSnapshot(
      viewerId,
      conversationId,
    );

    if (shouldPublishSeenUpdate) {
      await this.enqueueReadWatermarkUpdate({
        threadFbid,
        conversationId,
        participantId: viewerId,
        messageId,
        readTimestampMs: resolvedTimestampMs,
      });

      void this.emitReadEvents({
        threadFbid,
        conversationId,
        viewerId,
        messageId,
        readTimestampMs: resolvedTimestampMs,
        threadUnread: unreadSnapshot.threadUnread,
        unreadThreadCount: unreadSnapshot.unreadThreadCount,
        unreadStateSeq,
      });
    }

    return {
      participant_fbid: viewerId,
      watermark_timestamp_ms: resolvedTimestampMs,
      watermark_message_id: messageId,
      thread_unread: unreadSnapshot.threadUnread,
      unread_thread_count: unreadSnapshot.unreadThreadCount,
      unread_state_seq: unreadStateSeq,
    };
  }

  private async enqueueReadWatermarkUpdate(input: {
    threadFbid: string;
    conversationId: string;
    participantId: string;
    messageId: string;
    readTimestampMs: string;
  }): Promise<void> {
    const event: ConversationReadWatermarkUpdatedEventV1 = {
      eventId: randomUUID(),
      type: 'conversation.read_watermark_updated',
      version: 1,
      timestamp: Date.now(),
      data: input,
    };

    try {
      await this.streamService.produce(WsRedisKeys.readWatermarkStreamKey(), event);
    } catch (error) {
      this.logger.error(
        'Failed to enqueue read watermark update, falling back to direct persistence',
        {
          error,
          ...input,
        },
      );

      await this.watermarkRepo.advanceReadWatermark(
        input.conversationId,
        input.participantId,
        input.readTimestampMs,
      );

      await this.inboxThreadWriteRepo.markAsReadThrough(
        input.participantId,
        input.threadFbid,
        input.messageId,
      );
    }
  }

  private async emitReadEvents(input: {
    threadFbid: string;
    conversationId: string;
    viewerId: string;
    messageId: string;
    readTimestampMs: string;
    threadUnread: boolean;
    unreadThreadCount: number;
    unreadStateSeq: string;
  }): Promise<void> {
    const {
      threadFbid,
      conversationId,
      viewerId,
      messageId,
      readTimestampMs,
      threadUnread,
      unreadThreadCount,
      unreadStateSeq,
    } = input;
    const participants = await this.participantRepo.getParticipantsByConversationId(
      conversationId,
    );
    const participantIds = participants.map((participant) => participant.user_id);
    const now = Date.now();

    this.wsEmitter.emitToRoom(`user:${viewerId}`, 'inbox:update', {
      eventId: randomUUID(),
      timestamp: now,
      updateType: 'read',
      threadFbid,
      conversationId,
      participantId: viewerId,
      readWatermarkMessageId: messageId,
      readWatermarkTimestampMs: readTimestampMs,
      threadUnread,
      unreadThreadCount,
      unreadStateSeq,
      unreadCount: unreadThreadCount,
      updatedAt: now,
      participantIds,
    });

    for (const participantId of participantIds) {
      if (participantId === viewerId) {
        continue;
      }

      this.wsEmitter.emitToRoom(`user:${participantId}`, 'conversation.read_updated', {
        eventId: randomUUID(),
        timestamp: now,
        threadFbid,
        conversationId,
        participantId: viewerId,
        readWatermarkMessageId: messageId,
        readWatermarkTimestampMs: readTimestampMs,
      });
    }
  }
}
