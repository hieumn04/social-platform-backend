import { buildChatGatewayOptions } from '@/modules/chat/gateway/chat-gateway.config';
import { NestConfigService } from '@/shared/config/config.service';
import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class ChatGatewayModule {
  static register(): DynamicModule {
    return {
      module: ChatGatewayModule,
      providers: [
        {
          provide: 'CHAT_GATEWAY_OPTIONS',
          inject: [NestConfigService],
          useFactory: (config: NestConfigService) => {
            return buildChatGatewayOptions(config);
          },
        },
      ],
    };
  }
}
