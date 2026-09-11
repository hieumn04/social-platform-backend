import { Module } from '@nestjs/common';

import { WebSocketPersistenceModule } from '@/modules/chat/infrastructure/redis-cluster/redis-connection.module';
import { RefreshConnectionTTLUseCase } from '@/modules/chat/application/usecase/refresh-connection/refresh-connection-ttl.usecase';
import { NodeModule } from '@/shared/node/node.module';
import { FlushModule } from '@/shared/flush/flush.module';

@Module({
  imports: [NodeModule, WebSocketPersistenceModule, FlushModule],

  providers: [RefreshConnectionTTLUseCase],
  exports: [RefreshConnectionTTLUseCase],
})
export class RefreshConnectionTTLModule {}
