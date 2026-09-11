import { Module } from '@nestjs/common';

import { RegisterConnectionUseCase } from '@/modules/chat/application/usecase/register-connection/register-connection.usecase';
import { NodeModule } from '@/shared/node/node.module';
import { WebSocketPersistenceModule } from '@/modules/chat/infrastructure/redis-cluster/redis-connection.module';

import { NodeFlushPipelineManagerModule } from '@/modules/chat/application/service/node-flush-pipeline-manager.module';

@Module({
  imports: [
    NodeModule,
    WebSocketPersistenceModule,
    NodeFlushPipelineManagerModule,
  ],
  providers: [RegisterConnectionUseCase],
  exports: [RegisterConnectionUseCase],
})
export class RegisterConnectionModule {}
