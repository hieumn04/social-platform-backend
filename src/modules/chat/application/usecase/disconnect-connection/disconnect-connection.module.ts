import { Module } from '@nestjs/common';

import { WebSocketPersistenceModule } from '@/modules/chat/infrastructure/redis-cluster/redis-connection.module';
import { DisconnectConnectionUseCase } from '@/modules/chat/application/usecase/disconnect-connection/disconnect-connection.usecase';

import { NodeFlushPipelineManagerModule } from '@/modules/chat/application/service/node-flush-pipeline-manager.module';

@Module({
  imports: [WebSocketPersistenceModule, NodeFlushPipelineManagerModule],

  providers: [DisconnectConnectionUseCase],
  exports: [DisconnectConnectionUseCase],
})
export class DisConnectionModule {}
