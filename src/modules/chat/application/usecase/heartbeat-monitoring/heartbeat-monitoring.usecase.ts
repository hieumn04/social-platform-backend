import { ConnectionRepository } from '@/modules/chat/domain/repositories/connection.repository';
import { NodeId } from '@/modules/value-objects/nodeId';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HeartbeatMonitoringUseCase {
  constructor(
    @Inject('ConnectionRepository')
    private readonly repo: ConnectionRepository,
    private readonly nodeId: NodeId,
  ) {}

  async execute(): Promise<void> {
    await this.repo.heartbeatNode(this.nodeId.getValue());
  }
}
