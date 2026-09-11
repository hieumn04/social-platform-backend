import { Inject, Injectable } from '@nestjs/common';
import { MessageFanout } from '@/modules/message/application/port/message-fanout.port';
import { Message } from '@/modules/message/domain/models/messages.model';
import { WsEmitter } from '@/modules/chat/application/ports/ws-emitter';
import { AppLogger } from '@/shared/logger/applogger';
import { PushNotificationService } from '@/modules/notification/application/services/push-notification.service';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { UnreadStateVersionService } from '@/shared/redis-cluster/unread-state-version.service';

@Injectable()
export class MessageFanoutService implements MessageFanout {
  constructor(
    @Inject('WsEmitter')
    private readonly wsEmitter: WsEmitter,
    private readonly logger: AppLogger,
    private readonly pushNotificationService: PushNotificationService,
    private readonly inboxThreadRepository: TypeormInboxThreadRepository,
    private readonly unreadStateVersion: UnreadStateVersionService,
  ) {
    this.logger.setContext(MessageFanoutService.name);
  }

  /**
   * BROADCAST MESSAGE TO TARGETED USERS (MULTI-DEVICE ENABLED)
   *
   * Best-effort: swallows errors intentionally.
   * Retry is handled by delta sync (getEventsAfterSeq) — not by stream retry.
   * seq is included in payload so client can update its last_seq for delta sync.
   */
  async fanout(
    message: Message,
    participantIds: string[],
    clientContext: string,
    seq: string,
  ): Promise<void> {
    try {
      const roomId = message.conversationId;

      const messagePayload = {
        messageId: message.id,
        seq, // Client saves this as last_seq for delta sync
        clientContext, // Crucial for optimistic UI reconciliation
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        payload: message.payload,
        createdAt: message.createdAt,
        conversationId: roomId,
        eventType: 'NEW_MESSAGE',
      };

      this.logger.debug(
        `Fanning out message ${message.id} to users: ${participantIds.join(', ')}`,
      );

      const senderId = message.senderId;

      await Promise.all(
        participantIds.map(async (userId) => {
          // Allocate the version before reading the snapshot. Under concurrent
          // messages this may attach a newer count to an older version, but can
          // never attach a stale count to the newest version.
          const unreadStateSeq = await this.unreadStateVersion.next(userId);
          const snapshot =
            await this.inboxThreadRepository.getUnreadThreadSnapshot(userId, roomId);
          const payload = {
            ...messagePayload,
            recipientId: userId,
            threadFbid: snapshot.threadFbid,
            threadUnread: snapshot.threadUnread,
            unreadThreadCount: snapshot.unreadThreadCount,
            unreadStateSeq,
          };

          this.wsEmitter.emitToRoom(`user:${userId}`, 'message', payload);

          // Push is an independent background transport. The service worker
          // suppresses the OS notification when an app window is focused.
          if (userId !== senderId) {
            void this.pushNotificationService
              .sendToUser(userId, {
                title: 'New Message',
                body: message.content || 'You received a new message',
                data: payload,
              })
              .catch((err) =>
                this.logger.error(
                  `Failed to send Web Push notification to recipient=${userId}`,
                  err,
                ),
              );
          }
        }),
      );
    } catch (err) {
      // Best-effort: log only, do NOT re-throw
      // Fanout is non-idempotent — retry would cause duplicate WS push
      this.logger.warn(
        `Fanout failed for message ${message.id} (non-critical)`,
        {
          error: err,
          conversationId: message.conversationId,
        },
      );
    }
  }
}
