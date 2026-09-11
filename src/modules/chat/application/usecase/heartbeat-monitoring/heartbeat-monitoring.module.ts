import { Module } from '@nestjs/common';

import { NodeModule } from '@/shared/node/node.module';
import { HeartbeatMonitoringUseCase } from '@/modules/chat/application/usecase/heartbeat-monitoring/heartbeat-monitoring.usecase';

@Module({
  imports: [NodeModule],

  providers: [HeartbeatMonitoringUseCase],
  exports: [HeartbeatMonitoringUseCase],
})
export class HeartbeatMonitoringModule {}
