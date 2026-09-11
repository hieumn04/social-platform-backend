import { Module } from '@nestjs/common';
import { WebSocketPersistenceModule } from '@/modules/chat/infrastructure/redis-cluster/redis-connection.module';
import { NodeModule } from '@/shared/node/node.module';
import { CheckNodeStatusUseCase } from '@/modules/chat/application/usecase/check-node-status/check-node-status.usecase';

@Module({
  imports: [NodeModule, WebSocketPersistenceModule],

  providers: [CheckNodeStatusUseCase],
  exports: [CheckNodeStatusUseCase],
})
export class CheckNodeStatusModule {}
