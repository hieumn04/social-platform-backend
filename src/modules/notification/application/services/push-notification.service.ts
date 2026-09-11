import { Injectable, OnModuleInit } from '@nestjs/common';
import { NestConfigService } from '@/shared/config/config.service';
import { AppLogger } from '@/shared/logger/applogger';
import { PushSubscriptionRepository } from '../../infrastructure/repositories/push-subscription.repository';
import * as webpush from 'web-push';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  constructor(
    private readonly config: NestConfigService,
    private readonly logger: AppLogger,
    private readonly subscriptionRepo: PushSubscriptionRepository,
  ) {
    this.logger.setContext(PushNotificationService.name);
  }

  onModuleInit() {
    const subject = this.config.webpush.vapidSubject;
    const publicKey = this.config.webpush.vapidPublicKey;
    const privateKey = this.config.webpush.vapidPrivateKey;

    if (!subject || !publicKey || !privateKey) {
      throw new Error(
        'VAPID keys are missing! Please define VAPID_SUBJECT, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY in environment variables.',
      );
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.logger.log('Web Push VAPID credentials configured successfully');
    } catch (err: any) {
      this.logger.error('Failed to configure Web Push VAPID details', err);
      throw err;
    }
  }

  /**
   * Send push notification to all active subscriptions of a user
   * Best-effort: catches all errors, handles 404/410 by revoking subscription.
   */
  async sendToUser(userId: string, payload: any): Promise<void> {
    try {
      const subscriptions = await this.subscriptionRepo.getActiveSubscriptions(userId);
      if (!subscriptions.length) {
        this.logger.debug(`No active push subscriptions found for user=${userId}`);
        return;
      }

      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

      const promises = subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          // Direct messages are latency-sensitive. With the default
          // ("normal") urgency, Chromium/Edge push services may defer delivery
          // while the site is in a background tab. A short TTL also prevents an
          // notification from being discarded while the browser is suspended.
          await webpush.sendNotification(pushSubscription, payloadString, {
            TTL: 86_400,
            urgency: 'high',
          });
          this.logger.debug(`Successfully sent web push to user=${userId} subId=${sub.id}`);
        } catch (err: any) {
          this.logger.warn(`Failed to send web push for subId=${sub.id}`, {
            statusCode: err.statusCode,
            message: err.message,
          });

          // 404 (Not Found) or 410 (Gone) indicates the subscription has expired or is no longer valid
          if (err.statusCode === 404 || err.statusCode === 410) {
            this.logger.log(`Revoking invalid subscription for user=${userId} subId=${sub.id} endpoint=${sub.endpoint}`);
            await this.subscriptionRepo.revokeSubscription(userId, sub.endpoint).catch((revokeErr) => {
              this.logger.error(`Failed to revoke subscription subId=${sub.id}`, revokeErr);
            });
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (err: any) {
      // Catch-all to make sure the main chat/message sending flow is never affected
      this.logger.error(`Error in sendToUser for user=${userId}`, err);
    }
  }
}
