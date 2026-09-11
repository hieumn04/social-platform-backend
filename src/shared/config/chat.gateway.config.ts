import { getEnv } from '@/helper/getEnv';
import { WsConfig } from '@/types/socket/gateway';
import { registerAs } from '@nestjs/config';

export const socketConfig = registerAs('socket', (): WsConfig => {
  return {
    path: getEnv('WS_PATH'),
    namespace: getEnv('WS_NAMESPACE'),
    corsOrigins: getEnv('WS_CORS_ORIGINS').split(','),
    pingInterval: Number(getEnv('WS_PING_INTERVAL')),
    pingTimeout: Number(getEnv('WS_PING_TIMEOUT')),
  };
});
