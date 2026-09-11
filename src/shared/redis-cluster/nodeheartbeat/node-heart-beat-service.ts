import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AppLogger } from '@/shared/logger/applogger';
import { HeartbeatMonitoringUseCase } from '@/modules/chat/application/usecase/heartbeat-monitoring/heartbeat-monitoring.usecase';
import { console } from 'inspector';

@Injectable()
export class NodeHeartbeatService implements OnModuleInit, OnModuleDestroy {
  private stopped = false;
  private readonly intervalMs = 60_000;
  private timeout?: NodeJS.Timeout;

  constructor(
    private readonly heartbeatUC: HeartbeatMonitoringUseCase,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(NodeHeartbeatService.name);
  }

  onModuleInit() {
    this.logger.log('Starting node heartbeat');
    this.startLoop();
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.timeout) clearTimeout(this.timeout);
    this.logger.log('Node heartbeat stopped');
  }

  private startLoop() {
    if (this.stopped) return;

    this.timeout = setTimeout(async () => {
      try {
        const result = await this.heartbeatUC.execute();
        this.logger.log('Heartbeat executed', { result });
        console.log('Heartbeat executed', { result });
      } catch (err) {
        this.logger.error('Node heartbeat failed', { error: err });
      } finally {
        this.startLoop();
      }
    }, this.intervalMs);
  }
}
