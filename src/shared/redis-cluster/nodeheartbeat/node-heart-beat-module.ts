import { Module } from '@nestjs/common';
import { LoggerModule } from '@/shared/logger/logger.module';
import { HeartbeatMonitoringModule } from '@/modules/chat/application/usecase/heartbeat-monitoring/heartbeat-monitoring.module';
import { NodeHeartbeatService } from '@/shared/redis-cluster/nodeheartbeat/node-heart-beat-service';

@Module({
  imports: [HeartbeatMonitoringModule, LoggerModule],
  providers: [NodeHeartbeatService],
  exports: [NodeHeartbeatService],
})
export class NodeHeartBeatModule {}
