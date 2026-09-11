export interface NodeExecutionCoordinator {
  executeByNode<T>(
    items: readonly T[],
    options: {
      getNodeId(item: T): string | undefined;
      executeLocal(items: T[]): Promise<void>;
      delegateRemote(nodeId: string, items: T[]): Promise<void>;
      concurrencyLimit?: number;
      retryRemote?: number;
      remoteTimeout?: number;
    },
  ): Promise<void>;
}

export const NODE_EXECUTION_COORDINATOR = Symbol('NodeExecutionCoordinator');
