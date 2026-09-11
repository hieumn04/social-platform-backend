import { Injectable, Inject } from '@nestjs/common';

import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';

import { GetSlideMessageConnectionUseCase } from '@/modules/message/application/use-cases/slide-message/get-slide-messages.usecase';

import { ConversationParticipantRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant.repository';
import { ConversationWatermarksRepository } from '@/modules/coversation/infrastructure/repositories/conversation-watermarks.repository';

import { SlideMailboxThreadMapper } from '@/modules/coversation/infrastructure/mapper/slide-mailbox-thread.mapper';

import { UserReadRepository } from '@/modules/users/domain/repositories/user-read.interface.repository';

import { IBlockEdgeRepository } from '@/modules/social-graph/domain/repositories/block-edge.repository';

import { IRestrictEdgeRepository } from '@/modules/social-graph/domain/repositories/restrict-edge.repository';

import { ConversationCacheService } from '@/shared/redis-cluster/conversation/coversation-cache-service';
import { InboxOrderingCacheService } from '@/shared/redis-cluster/conversation/services/inbox-ordering-cache.service';
import { WatermarkCacheService } from '@/shared/redis-cluster/conversation/services/watermark-cache.service';

import { AppLogger } from '@/shared/logger/applogger';
import { InboxThreadSqlRow } from '@/types/typeModel/inbox-thread.raw-row';
import { SlideMessageConnection } from '@/types/typeModel/message-raw';
import { InboxThreadOrderingDomainService } from '@/modules/coversation/domain/service/inbox-thread-ordering.domain-service';
import { UnreadStateVersionService } from '@/shared/redis-cluster/unread-state-version.service';

const MAX_MESSAGE_ID = '999999999999999999999999999';
const INBOX_PAGE_SIZE = 20;

@Injectable()
export class GetSlideMailBoxForIrisSubscriptionUseCase {
  constructor(
    private readonly logger: AppLogger,

    private readonly inboxThreadRepository: TypeormInboxThreadRepository,

    private readonly getSlideMessageConnectionUseCase: GetSlideMessageConnectionUseCase,

    private readonly participantRepo: ConversationParticipantRepository,
    private readonly watermarkRepo: ConversationWatermarksRepository,
    private readonly watermarkCache: WatermarkCacheService,

    private readonly cache: ConversationCacheService,

    @Inject('UserReadRepository')
    private readonly userRepo: UserReadRepository,

    @Inject('IBlockEdgeRepository')
    private readonly blockRepo: IBlockEdgeRepository,

    @Inject('IRestrictEdgeRepository')
    private readonly restrictRepo: IRestrictEdgeRepository,

    private readonly inboxOrderingCache: InboxOrderingCacheService,
    private readonly unreadStateVersion: UnreadStateVersionService,
  ) {
    this.logger.setContext(GetSlideMailBoxForIrisSubscriptionUseCase.name);
  }

  async execute(userId: string) {
    const unreadSummaryPromise = this.getUnreadSummary(userId);
    // 1. LOAD THREADS (CACHE-FIRST)

    const threadFbids = await this.inboxOrderingCache.getInboxThreadsPaged(
      userId,
      INBOX_PAGE_SIZE,
    );

    let threads: InboxThreadSqlRow[] = [];

    if (threadFbids && threadFbids.length > 0) {
      const cachedSummaries = await Promise.all(
        threadFbids.map((fbid) =>
          this.inboxOrderingCache.getThreadSummary(fbid),
        ),
      );

      const cachedThreads: InboxThreadSqlRow[] = [];
      const missingFbids: string[] = [];

      for (let i = 0; i < threadFbids.length; i++) {
        const summary = cachedSummaries[i];

        if (summary) {
          cachedThreads.push(
            this.inboxOrderingCache.deserializeSummary(
              summary,
            ) as InboxThreadSqlRow,
          );
        } else {
          missingFbids.push(threadFbids[i]);
        }
      }

      if (missingFbids.length > 0) {
        const dbMissingThreads =
          await this.inboxThreadRepository.getThreadsByFbids(
            userId,
            missingFbids,
          );

        threads =
          InboxThreadOrderingDomainService.mergeMissingThreadsAndOrderByCache(
            threadFbids,
            cachedThreads,
            dbMissingThreads,
          );

        void this.inboxOrderingCache
          .warmUpUserInbox(userId, dbMissingThreads, {
            resetInboxLists: false,
          })
          .catch((error) => {
            this.logger.warn('Failed to warmup missing inbox cache', {
              error,
              userId,
            });
          });
      } else {
        threads = InboxThreadOrderingDomainService.orderByThreadFbids(
          threadFbids,
          cachedThreads,
        );
      }
    } else {
      threads = await this.inboxThreadRepository.getLatestThreads(
        userId,
        INBOX_PAGE_SIZE,
      );

      threads = InboxThreadOrderingDomainService.limitPage(
        threads,
        INBOX_PAGE_SIZE,
      );

      if (threads.length > 0) {
        void this.inboxOrderingCache
          .warmUpUserInbox(userId, threads, {
            resetInboxLists: true,
          })
          .catch((error) => {
            this.logger.warn('Failed to warmup full inbox cache', {
              error,
              userId,
            });
          });
      }
    }

    if (!threads || !threads.length) {
      const unreadSummary = await unreadSummaryPromise;
      return {
        __typename: 'SlideMailbox',
        iris_inactive_subscription_uq_seq_id: '0',
        unread_thread_count: unreadSummary.unread_thread_count,
        unread_state_seq: unreadSummary.unread_state_seq,
        threads_by_folder: {
          edges: [],
          page_info: {
            has_next_page: false,
            end_cursor: null,
          },
        },
        pinned_threads_v2: [],
      };
    }

    // =====================================================
    // 2. CACHE-FIRST PARTICIPANTS
    // =====================================================

    const participantsMap = new Map<string, string[]>();

    const missingConversationIds = new Set<string>();

    await Promise.all(
      threads.map(async (thread) => {
        try {
          const cachedParticipants = await this.cache.getParticipants(
            thread.thread_fbid,
          );

          if (cachedParticipants.length) {
            participantsMap.set(thread.conversation_id, cachedParticipants);

            return;
          }

          missingConversationIds.add(thread.conversation_id);
        } catch (error) {
          this.logger.warn('participants cache read failed', {
            threadFbid: thread.thread_fbid,
            error,
          });

          missingConversationIds.add(thread.conversation_id);
        }
      }),
    );

    // =====================================================
    // 3. FETCH MISSING PARTICIPANTS FROM DB
    // =====================================================

    if (missingConversationIds.size > 0) {
      const dbParticipants =
        await this.participantRepo.getParticipantsByConversationIds(
          Array.from(missingConversationIds),
        );

      const groupedDbParticipants = new Map<string, string[]>();

      // group by conversation
      for (const participant of dbParticipants) {
        if (!groupedDbParticipants.has(participant.conversation_id)) {
          groupedDbParticipants.set(participant.conversation_id, []);
        }

        groupedDbParticipants
          .get(participant.conversation_id)!
          .push(participant.user_id);
      }

      // merge + async cache warm
      for (const thread of threads) {
        const conversationId = thread.conversation_id;

        // already from cache
        if (participantsMap.has(conversationId)) {
          continue;
        }

        const uniqueUserIds = [
          ...new Set(groupedDbParticipants.get(conversationId) ?? []),
        ];

        participantsMap.set(conversationId, uniqueUserIds);

        // IMPORTANT:
        // cache warming must NEVER block request lifecycle
        void this.cache
          .setParticipants(thread.thread_fbid, uniqueUserIds)
          .catch((error: any) =>
            this.logger.warn('participants cache warm failed', {
              threadFbid: thread.thread_fbid,
              error,
            }),
          );
      }
    }

    // =====================================================
    // 4. BUILD UNIQUE USER IDS
    // =====================================================

    const allUserIds = new Set<string>();

    allUserIds.add(userId);

    for (const participantIds of participantsMap.values()) {
      for (const participantId of participantIds) {
        allUserIds.add(participantId);
      }
    }

    const allUserIdsArray = Array.from(allUserIds);

    const otherUserIds = allUserIdsArray.filter((id) => id !== userId);

    // =====================================================
    // 5. MESSAGE INPUTS
    // =====================================================

    const messageInputs = threads.map((thread) => ({
      threadId: thread.conversation_id,
      threadFbid: thread.thread_fbid,

      lastMessageId: thread.last_message_id ?? MAX_MESSAGE_ID,
    }));

    // =====================================================
    // 6. PARALLEL LOAD:
    //    - profiles
    //    - relations
    //    - messages
    // =====================================================

    const [profiles, blockedSet, restrictedSet, messageResults] =
      await Promise.all([
        this.userRepo.findProfilesByIds(allUserIdsArray),

        otherUserIds.length
          ? this.blockRepo.findBlockedTargets(userId, otherUserIds)
          : Promise.resolve(new Set<string>()),

        otherUserIds.length
          ? this.restrictRepo.findRestrictedTargets(userId, otherUserIds)
          : Promise.resolve(new Set<string>()),

        this.getSlideMessageConnectionUseCase.execute(messageInputs),
      ]);

    // =====================================================
    // 7. BUILD LOOKUP MAPS
    // =====================================================

    const profileMap = new Map(
      profiles.filter(Boolean).map((profile) => [profile.user_id, profile]),
    );

    const messageMap = new Map(
      messageResults.map((message) => [message.threadId, message.connection]),
    );

    const unreadByConversationId = await this.resolveUnreadState(
      threads,
      userId,
      messageMap,
    );
    const readReceiptsMap = await this.resolveReadReceipts(
      threads,
      userId,
      messageMap,
    );

    const hydratedThreads = threads.map((thread) => ({
      ...thread,
      marked_as_unread:
        unreadByConversationId.get(thread.conversation_id) ??
        Boolean(thread.marked_as_unread),
    }));

    // =====================================================
    // 8. BUILD GRAPHQL EDGES
    // =====================================================

    const edges = SlideMailboxThreadMapper.toEdges(
      hydratedThreads,
      messageMap,
      userId,
      {
        participantsMap,
        profileMap,
        blockedSet,
        restrictedSet,
        readReceiptsMap,
      },
    );

    // =====================================================
    // 9. BUILD PINNED THREADS
    // =====================================================

    const pinnedThreads = threads
      .filter((thread) => Boolean(thread.pinned))
      .map((thread) => {
        const participantIds =
          participantsMap.get(thread.conversation_id) ?? [];

        const otherUserId = participantIds.find((id) => id !== userId) ?? '';

        const otherUserProfile = profileMap.get(otherUserId);

        return {
          id: String(thread.thread_fbid),

          thread_title:
            thread.display_name ?? otherUserProfile?.full_name ?? null,

          is_pin: true,
        };
      });

    // =====================================================
    // 10. RESPONSE
    // =====================================================

    const unreadSummary = await unreadSummaryPromise;

    return {
      __typename: 'SlideMailbox',

      iris_inactive_subscription_uq_seq_id: '0',
      unread_thread_count: unreadSummary.unread_thread_count,
      unread_state_seq: unreadSummary.unread_state_seq,

      threads_by_folder: {
        edges,

        page_info: {
          has_next_page: false,

          end_cursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
      },

      pinned_threads_v2: pinnedThreads,
    };
  }

  async getUnreadSummary(userId: string): Promise<{
    unread_thread_count: number;
    unread_state_seq: string;
  }> {
    const unreadStateSeq = await this.unreadStateVersion.current(userId);
    const snapshot = await this.inboxThreadRepository.getUnreadThreadSnapshot(userId);

    return {
      unread_thread_count: snapshot.unreadThreadCount,
      unread_state_seq: unreadStateSeq,
    };
  }

  private async resolveUnreadState(
    threads: InboxThreadSqlRow[],
    userId: string,
    messageMap: Map<string, SlideMessageConnection>,
  ): Promise<Map<string, boolean>> {
    const unreadByConversationId = new Map<string, boolean>();

    if (!threads.length) {
      return unreadByConversationId;
    }

    const readTimestampsFromRedis =
      await this.watermarkCache.getManyReadTimestamps(
        threads.map((thread) => ({
          threadFbid: thread.thread_fbid,
          participantId: userId,
        })),
      );

    const missingThreads = threads.filter(
      (thread) => !readTimestampsFromRedis.has(thread.thread_fbid),
    );

    const readTimestampsByConversationId = new Map<string, string>();

    for (const thread of threads) {
      const timestamp = readTimestampsFromRedis.get(thread.thread_fbid);
      if (timestamp) {
        readTimestampsByConversationId.set(thread.conversation_id, timestamp);
      }
    }

    if (missingThreads.length > 0) {
      const dbWatermarks =
        await this.watermarkRepo.getReadWatermarksForParticipant(
          missingThreads.map((thread) => thread.conversation_id),
          userId,
        );

      for (const row of dbWatermarks) {
        readTimestampsByConversationId.set(
          row.conversation_id,
          row.read_watermark_timestamp_ms,
        );
      }
    }

    for (const thread of threads) {
      const latestMessage = messageMap.get(thread.conversation_id)?.edges?.[0]
        ?.node;

      if (!latestMessage) {
        unreadByConversationId.set(
          thread.conversation_id,
          Boolean(thread.marked_as_unread),
        );
        continue;
      }

      if (String(latestMessage.sender_fbid) === String(userId)) {
        unreadByConversationId.set(thread.conversation_id, false);
        continue;
      }

      const readTimestampMs = Number(
        readTimestampsByConversationId.get(thread.conversation_id) ?? '0',
      );
      const latestTimestampMs = Number(latestMessage.timestamp_ms ?? '0');

      unreadByConversationId.set(
        thread.conversation_id,
        latestTimestampMs > readTimestampMs,
      );
    }

    return unreadByConversationId;
  }

  private async resolveReadReceipts(
    threads: InboxThreadSqlRow[],
    viewerId: string,
    messageMap: Map<string, SlideMessageConnection>,
  ): Promise<
    Map<
      string,
      Array<{
        participant_fbid: string;
        watermark_timestamp_ms: string;
        watermark_message_id: string | null;
      }>
    >
  > {
    const receiptsByConversationId = new Map<
      string,
      Array<{
        participant_fbid: string;
        watermark_timestamp_ms: string;
        watermark_message_id: string | null;
      }>
    >();

    if (!threads.length) {
      return receiptsByConversationId;
    }

    const watermarkEntriesByThread = await Promise.all(
      threads.map(async (thread) => ({
        thread,
        entries: await this.watermarkCache.getAll(thread.thread_fbid),
      })),
    );

    const missingThreads = watermarkEntriesByThread
      .filter(({ entries }) => entries.length === 0)
      .map(({ thread }) => thread);

    for (const { thread, entries } of watermarkEntriesByThread) {
      if (!entries.length) {
        continue;
      }

      const list = entries
        .filter((entry) => Number(entry.readWatermarkTimestampMs) > 0)
        .map((entry) => ({
          participant_fbid: entry.participantId,
          watermark_timestamp_ms: entry.readWatermarkTimestampMs,
          watermark_message_id: null,
        }));

      if (list.length) {
        receiptsByConversationId.set(thread.conversation_id, list);
      }
    }

    if (missingThreads.length > 0) {
      const dbRows = await this.watermarkRepo.getWatermarks(
        missingThreads.map((thread) => thread.conversation_id),
      );

      const rowsByConversationId = new Map<string, typeof dbRows>();

      for (const row of dbRows) {
        const rows = rowsByConversationId.get(row.conversation_id) ?? [];
        rows.push(row);
        rowsByConversationId.set(row.conversation_id, rows);
      }

      for (const thread of missingThreads) {
        const rows = rowsByConversationId.get(thread.conversation_id) ?? [];
        const cacheEntries = rows.map((row) => ({
          participantId: row.participant_id,
          deliveryWatermarkTimestampMs: row.delivery_watermark_timestamp_ms,
          readWatermarkTimestampMs: row.read_watermark_timestamp_ms,
        }));

        if (cacheEntries.length) {
          void this.watermarkCache
            .warmUp(thread.thread_fbid, cacheEntries)
            .catch((error: any) =>
              this.logger.warn('watermark cache warm failed', {
                threadFbid: thread.thread_fbid,
                error,
              }),
            );
        }

        const list = rows
          .filter((row) => Number(row.read_watermark_timestamp_ms) > 0)
          .map((row) => ({
            participant_fbid: row.participant_id,
            watermark_timestamp_ms: row.read_watermark_timestamp_ms,
            watermark_message_id: null,
          }));

        if (list.length) {
          receiptsByConversationId.set(thread.conversation_id, list);
        }
      }
    }

    for (const thread of threads) {
      const receipts = receiptsByConversationId.get(thread.conversation_id);
      const edges = messageMap.get(thread.conversation_id)?.edges ?? [];

      if (!receipts?.length || !edges.length) {
        continue;
      }

      for (const receipt of receipts) {
        if (receipt.watermark_message_id) {
          continue;
        }

        const matched = edges.find(
          (edge) =>
            Number(edge.node.timestamp_ms) <=
            Number(receipt.watermark_timestamp_ms),
        );

        receipt.watermark_message_id = matched?.node.id ?? null;
      }
    }

    return receiptsByConversationId;
  }
}
