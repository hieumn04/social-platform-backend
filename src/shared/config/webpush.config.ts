import { getEnv } from '@/helper/getEnv';
import { registerAs } from '@nestjs/config';

export interface WebPushConfig {
  vapidSubject: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
}

export const webpushConfig = registerAs('webpush', (): WebPushConfig => {
  return {
    vapidSubject: getEnv('VAPID_SUBJECT'),
    vapidPublicKey: getEnv('VAPID_PUBLIC_KEY'),
    vapidPrivateKey: getEnv('VAPID_PRIVATE_KEY'),
  };
});
