import { NestConfigService } from '@/shared/config/config.service';
import { WsConfig } from '@/types/socket/gateway';

export const buildChatGatewayOptions = (
  config: NestConfigService,
): WsConfig => ({
  path: config.socket.path,
  namespace: config.socket.namespace || '/chat',
  corsOrigins: config.socket.corsOrigins,
  pingInterval: config.socket.pingInterval,
  pingTimeout: config.socket.pingTimeout,
});
