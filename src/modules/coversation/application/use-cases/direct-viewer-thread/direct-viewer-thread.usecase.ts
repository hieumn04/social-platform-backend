import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AppLogger } from '@/shared/logger/applogger';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { ConversationParticipantRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant.repository';
import { UserReadRepository } from '@/modules/users/domain/repositories/user-read.interface.repository';
import { IBlockEdgeRepository } from '@/modules/social-graph/domain/repositories/block-edge.repository';
import { IRestrictEdgeRepository } from '@/modules/social-graph/domain/repositories/restrict-edge.repository';
import { isGroupConversation } from '@/modules/coversation/infrastructure/mapper/conversation-subtype.mapper';
import { ConversationCacheService } from '@/shared/redis-cluster/conversation/coversation-cache-service';
import { GetSlideMessageConnectionUseCase } from '@/modules/message/application/use-cases/slide-message/get-slide-messages.usecase';
import { ConversationWatermarksRepository } from '@/modules/coversation/infrastructure/repositories/conversation-watermarks.repository';
import { WatermarkCacheService } from '@/shared/redis-cluster/conversation/services/watermark-cache.service';
import { SlideMessageConnection } from '@/types/typeModel/message-raw';

type GetSlideThreadNullableResult = {
  id: string;
  as_ig_direct_thread: any;
} | null;

export interface OpenConversationOptions {
  before?: string | null;
  messageCount?: number;
  minUqSeqId?: string | null;
}

@Injectable()
export class DirectViewerThreadUseCase {
  constructor(
    private readonly logger: AppLogger,
    private readonly inboxRepo: TypeormInboxThreadRepository,
    private readonly participantRepo: ConversationParticipantRepository,
    private readonly cache: ConversationCacheService,
    private readonly messageConnectionUseCase: GetSlideMessageConnectionUseCase,
    private readonly watermarkRepo: ConversationWatermarksRepository,
    private readonly watermarkCache: WatermarkCacheService,

    @Inject('UserReadRepository')
    private readonly userRepo: UserReadRepository,

    @Inject('IBlockEdgeRepository')
    private readonly blockRepo: IBlockEdgeRepository,

    @Inject('IRestrictEdgeRepository')
    private readonly restrictRepo: IRestrictEdgeRepository,
  ) {
    this.logger.setContext(DirectViewerThreadUseCase.name);
  }

  async execute(
    viewerId: string,
    threadFbid: string,
    options: OpenConversationOptions = {},
  ): Promise<GetSlideThreadNullableResult> {
    try {
      if (!viewerId || !threadFbid) {
        return null;
      }

      // =========================
      // 1. THREAD (SOURCE OF TRUTH)
      // =========================
      const thread = await this.inboxRepo.findByViewerAndThreadFbId(
        viewerId,
        threadFbid,
      );

      if (!thread) {
        throw new NotFoundException('Thread not found');
      }

      const conversationId = thread.conversation_id;

      // =========================
      // 2. CACHE META (FIRE & FORGET)
      // =========================
      void this.cache
        .setConversationId(threadFbid, conversationId)
        .catch((err: any) =>
          this.logger.warn('setThreadMeta failed', {
            error: err,
          }),
        );

      // =========================
      // 3. RESOLVE PARTICIPANTS (CACHE FIRST)
      // =========================
      let userIds = await this.cache.getParticipants(threadFbid);

      if (!userIds.length) {
        const participants =
          await this.participantRepo.getParticipantsByConversationId(
            conversationId,
          );

        userIds = [...new Set(participants.map((p) => p.user_id))];

        void this.cache.setParticipants(threadFbid, userIds).catch((err: any) =>
          this.logger.warn('cache warm failed', {
            error: err,
          }),
        );
      }

      if (!userIds.length) return null;

      // =========================
      // 4. FILTER VIEWER
      // =========================
      const otherUserIds = userIds.filter((id: string) => id !== viewerId);

      // =========================
      // 5. PARALLEL FETCH
      // =========================
      const profilesPromise = this.userRepo.findProfilesByIds(userIds);

      const relationPromise = otherUserIds.length
        ? Promise.all([
            this.blockRepo.findBlockedTargets(viewerId, otherUserIds),
            this.restrictRepo.findRestrictedTargets(viewerId, otherUserIds),
          ])
        : Promise.resolve([new Set<string>(), new Set<string>()]);

      const messagePromise = this.messageConnectionUseCase.executePage({
        conversationId,
        threadFbid,
        before: options.before,
        limit: options.messageCount,
      });

      const receiptsPromise = this.resolveReadReceipts(
        threadFbid,
        conversationId,
      );

      const [
        profiles,
        [blockedSet, restrictedSet],
        messageConnection,
        readReceipts,
      ] = await Promise.all([
        profilesPromise,
        relationPromise,
        messagePromise,
        receiptsPromise,
      ]);

      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      // =========================
      // 6. BUILD USERS
      // =========================
      const users = otherUserIds.map((id: string) => {
        const p = profileMap.get(id);

        return {
          id: id,
          username: p?.username ?? null,
          full_name: p?.full_name ?? null,
          profile_pic_url: p?.avatar_url ?? null,
          interop_messaging_user_fbid: p?.fbid_v2 ?? null,
          is_verified: p?.is_verified ?? false,
          friendship_status: {
            is_restricted: restrictedSet.has(id),
            blocking: blockedSet.has(id),
          },
        };
      });

      const viewerProfile = profileMap.get(viewerId);

      const viewer = {
        id: viewerId,
        username: viewerProfile?.username ?? null,
        full_name: viewerProfile?.full_name ?? null,
        profile_pic_url: viewerProfile?.avatar_url ?? null,
        interop_messaging_user_fbid: viewerProfile?.fbid_v2 ?? null,
      };

      const firstUser = users[0];
      for (const receipt of readReceipts) {
        const matchingMessage = messageConnection.edges.find(
          (edge) =>
            Number(edge.node.timestamp_ms) <=
            Number(receipt.watermark_timestamp_ms),
        );
        receipt.watermark_message_id = matchingMessage?.node.id ?? null;
      }

      const markedAsUnread = this.resolveUnreadState(
        viewerId,
        Boolean(thread.marked_as_unread),
        messageConnection,
        readReceipts,
      );

      // =========================
      // 7. RESPONSE (GIỮ NGUYÊN SHAPE)
      // =========================
      const result: GetSlideThreadNullableResult = {
        id: thread.thread_fbid,
        as_ig_direct_thread: {
          id: thread.thread_fbid,
          thread_fbid: thread.thread_fbid,
          thread_subtype: thread.thread_subtype,
          thread_key: thread.thread_key,
          thread_id: conversationId,

          viewer_id: viewerId,
          is_group: isGroupConversation(thread.thread_subtype),
          is_pin: Boolean(thread.pinned),
          is_muted: Boolean(thread.muted),
          marked_as_unread: markedAsUnread,
          last_activity_timestamp_ms: thread.last_activity_at
            ? String(new Date(thread.last_activity_at).getTime())
            : null,

          thread_title: thread.display_name ?? firstUser?.full_name ?? null,

          thread_image_url:
            thread.display_avatar_url ?? firstUser?.profile_pic_url ?? null,

          messaging_folder_tag: thread.system_folder,
          reachability_status: thread.reachability_status,

          users,
          viewer,
          nicknames: [],
          slide_read_receipts: readReceipts,
          slide_messages: messageConnection,
        },
      };

      return result;
    } catch (error) {
      this.logger.error('DirectViewerThreadUseCase failed', {
        viewerId,
        threadFbid,
        error,
      });
      throw error;
    }
  }

  private async resolveReadReceipts(
    threadFbid: string,
    conversationId: string,
  ): Promise<
    Array<{
      participant_fbid: string;
      watermark_timestamp_ms: string;
      watermark_message_id: string | null;
    }>
  > {
    let entries = await this.watermarkCache.getAll(threadFbid);

    if (!entries.length) {
      const rows = await this.watermarkRepo.getWatermarks([conversationId]);
      entries = rows.map((row) => ({
        participantId: row.participant_id,
        deliveryWatermarkTimestampMs: row.delivery_watermark_timestamp_ms,
        readWatermarkTimestampMs: row.read_watermark_timestamp_ms,
      }));

      if (entries.length) {
        void this.watermarkCache.warmUp(threadFbid, entries).catch((error) =>
          this.logger.warn('watermark cache warm failed', {
            threadFbid,
            error,
          }),
        );
      }
    }

    return entries
      .filter((entry) => Number(entry.readWatermarkTimestampMs) > 0)
      .map((entry) => ({
        participant_fbid: entry.participantId,
        watermark_timestamp_ms: entry.readWatermarkTimestampMs,
        watermark_message_id: null as string | null,
      }));
  }

  private resolveUnreadState(
    viewerId: string,
    persistedUnread: boolean,
    messages: SlideMessageConnection,
    receipts: Array<{
      participant_fbid: string;
      watermark_timestamp_ms: string;
    }>,
  ): boolean {
    const latestMessage = messages.edges[0]?.node;
    if (!latestMessage) return persistedUnread;
    if (String(latestMessage.sender_fbid) === String(viewerId)) return false;

    const viewerReceipt = receipts.find(
      (receipt) => String(receipt.participant_fbid) === String(viewerId),
    );

    return (
      Number(latestMessage.timestamp_ms) >
      Number(viewerReceipt?.watermark_timestamp_ms ?? '0')
    );
  }
}
