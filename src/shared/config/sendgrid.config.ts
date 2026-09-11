import { registerAs } from '@nestjs/config';
import { getEnv } from 'src/helper/getEnv';
import { SENDGRID } from 'src/types/sendgrid/sendgrid.types';

export const sendgridConfig = registerAs(
  'sendgrid',
  (): SENDGRID => ({
    apiKey: getEnv('SENDGRID_API_KEY'),
    senderEmail: getEnv('SENDGRID_SENDER_EMAIL'),
    senderName: getEnv('SENDGRID_SENDER_NAME'),
    replyTo: getEnv('SENDGRID_REPLY_TO'),
  }),
);
