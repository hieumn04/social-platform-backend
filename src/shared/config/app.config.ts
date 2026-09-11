import { registerAs } from '@nestjs/config';
import { AppConfig } from 'src/types/environment';

import { getEnv } from '@/helper/getEnv';
import { parseNodeEnv } from '@/shared/config/env';

export const appConfig = registerAs('app', (): { app: AppConfig } => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: parseNodeEnv(process.env.NODE_ENV),
    workerId: parseInt(getEnv('WORKER_ID'), 10),
  },
}));
