import { ResolveUserSocketsUseCase } from '@/modules/chat/application/usecase/resolve-user-sockets.usecase/resolve-user-sockets.usecase';
import { WebSocketPersistenceModule } from '@/modules/chat/infrastructure/redis-cluster/redis-connection.module';
import { FlushModule } from '@/shared/flush/flush.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [WebSocketPersistenceModule, FlushModule],

  providers: [ResolveUserSocketsUseCase],
  exports: [ResolveUserSocketsUseCase],
})
export class ResolveUserSocketsModule {}
