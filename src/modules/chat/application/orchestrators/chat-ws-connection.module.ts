import { Module } from '@nestjs/common';

import { RegisterConnectionModule } from '@/modules/chat/application/usecase/register-connection/register-connection.module';
import { DisConnectionModule } from '@/modules/chat/application/usecase/disconnect-connection/disconnect-connection.module';
import { NodeExecutionCoordinatorModule } from '@/modules/chat/application/service/default-node-execution-coordinator.module';
import { ChatWsConnectionService } from '@/modules/chat/application/orchestrators/chat-ws-connection.service';

@Module({
  imports: [
    NodeExecutionCoordinatorModule,
    RegisterConnectionModule,
    DisConnectionModule,
  ],
  providers: [ChatWsConnectionService],
  exports: [ChatWsConnectionService],
})
export class ChatWsConnectionModule {}
