import { registerAs } from '@nestjs/config';
import { getEnv } from 'src/helper/getEnv';
import { MAIL } from 'src/types/mail/mail.types';

export const mailConfig = registerAs(
  'mail',
  (): MAIL => ({
    appPassword: getEnv('GMAIL_APP_PASSWORD'),
    senderEmail: getEnv('GMAIL_USER'),
    senderName: getEnv('GMAIL_SENDER_NAME'),
    replyTo: getEnv('GMAIL_REPLY_TO'),
  }),
);
