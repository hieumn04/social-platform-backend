import {
  NODE_EXECUTION_COORDINATOR,
  NodeExecutionCoordinator,
} from '@/modules/chat/application/ports/node-execution-coordinator.interface';
import { DisconnectConnectionUseCase } from '@/modules/chat/application/usecase/disconnect-connection/disconnect-connection.usecase';
import { RegisterConnectionInput } from '@/modules/chat/application/usecase/register-connection/register-connection.input';
import { RegisterConnectionUseCase } from '@/modules/chat/application/usecase/register-connection/register-connection.usecase';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ChatWsConnectionService {
  constructor(
    @Inject(NODE_EXECUTION_COORDINATOR)
    private readonly coordinator: NodeExecutionCoordinator,
    private readonly registerUC: RegisterConnectionUseCase,
    private readonly disconnectUC: DisconnectConnectionUseCase,
  ) {}

  async onConnect(input: RegisterConnectionInput): Promise<void> {
    await this.coordinator.executeByNode([input], {
      getNodeId: (item) => item.nodeId,
      executeLocal: async (items) => this.registerUC.execute(items),
      delegateRemote: async () => {},
    });
  }

  async onDisconnect(input: {
    socketId: string;
    userId: string;
  }): Promise<void> {
    await this.coordinator.executeByNode([input], {
      getNodeId: (item) => undefined,

      executeLocal: async (items) => {
        await this.disconnectUC.execute(items);
      },

      delegateRemote: async () => {},
    });
  }
}
