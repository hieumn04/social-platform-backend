import { NODE_EXECUTION_COORDINATOR } from '@/modules/chat/application/ports/node-execution-coordinator.interface';
import { DefaultNodeExecutionCoordinator } from '@/modules/chat/application/service/default-node-execution-coordinator';
import { NodeModule } from '@/shared/node/node.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [NodeModule],
  providers: [
    {
      provide: NODE_EXECUTION_COORDINATOR,
      useClass: DefaultNodeExecutionCoordinator,
    },
  ],
  exports: [NODE_EXECUTION_COORDINATOR],
})
export class NodeExecutionCoordinatorModule {}
