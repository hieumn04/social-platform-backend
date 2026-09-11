import { NodeExecutionCoordinator } from '@/modules/chat/application/ports/node-execution-coordinator.interface';
import { AppLogger } from '@/shared/logger/applogger';
import { NodeIdResolver } from '@/shared/node/node-id.resolver.interface';
import { NODE_ID_RESOLVER } from '@/shared/node/node-id.tokens';
import { Inject, Injectable } from '@nestjs/common';
import pLimit from 'p-limit';

interface NodeMetrics {
  executeLocalMs: number;
  delegateRemoteMs: number;
  success: boolean;
  nodeId: string;
  itemsCount: number;
}

@Injectable()
export class DefaultNodeExecutionCoordinator
  implements NodeExecutionCoordinator
{
  constructor(
    @Inject(NODE_ID_RESOLVER)
    private readonly nodeIdResolver: NodeIdResolver,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(DefaultNodeExecutionCoordinator.name);
  }

  async executeByNode<T>(
    items: readonly T[],
    options: {
      getNodeId(item: T): string | undefined;
      executeLocal(items: T[]): Promise<void>;
      delegateRemote?: (nodeId: string, items: T[]) => Promise<void>;
      concurrencyLimit?: number;
      retryRemote?: number;
      remoteTimeout?: number;
    },
  ): Promise<void> {
    if (!items.length) return;

    const {
      getNodeId,
      executeLocal,
      delegateRemote,
      concurrencyLimit = Infinity,
      retryRemote = 0,
      remoteTimeout = 2000,
    } = options;

    const currentNodeId = this.nodeIdResolver.resolve().getValue();

    const grouped = new Map<string, T[]>();
    for (const item of items) {
      const resolvedNodeId =
        this.nodeIdResolver.resolve(getNodeId(item)).getValue() ||
        'UNDEFINED_NODE';
      if (!grouped.has(resolvedNodeId)) grouped.set(resolvedNodeId, []);
      grouped.get(resolvedNodeId)!.push(item);
    }

    this.logger.log(
      `Executing by node, total nodes: ${grouped.size}, total items: ${items.length}`,
    );

    const limit = pLimit(concurrencyLimit);
    const metrics: NodeMetrics[] = [];
    const tasks: Promise<void>[] = [];

    for (const [nodeId, nodeItems] of grouped.entries()) {
      tasks.push(
        limit(async () => {
          const metric: NodeMetrics = {
            executeLocalMs: 0,
            delegateRemoteMs: 0,
            success: false,
            nodeId,
            itemsCount: nodeItems.length,
          };
          const startLocal = Date.now();
          try {
            this.logger.debug(
              `Node ${nodeId} - executeLocal start with ${nodeItems.length} items`,
            );
            await executeLocal(nodeItems);
            metric.executeLocalMs = Date.now() - startLocal;
            this.logger.log(
              `Node ${nodeId} - executeLocal done in ${metric.executeLocalMs}ms`,
            );

            if (delegateRemote && nodeId !== currentNodeId) {
              const startRemote = Date.now();
              this.logger.debug(`Node ${nodeId} - delegateRemote start`);
              await this.delegateWithRetry(
                nodeId,
                nodeItems,
                delegateRemote,
                retryRemote,
                remoteTimeout,
              );
              metric.delegateRemoteMs = Date.now() - startRemote;
              this.logger.log(
                `Node ${nodeId} - delegateRemote done in ${metric.delegateRemoteMs}ms`,
              );
            }
            metric.success = true;
          } catch (err) {
            this.logger.error(`Node ${nodeId} failed`, {
              error: err,
              items: nodeItems,
            });
            metric.success = false;
          } finally {
            metrics.push(metric);
          }
        }),
      );
    }

    await Promise.all(tasks);

    const succeeded = metrics.filter((m) => m.success).length;
    const failed = metrics.filter((m) => !m.success).length;
    this.logger.log(
      `NodeExecutionCoordinator summary - succeeded: ${succeeded}, failed: ${failed}`,
    );
    metrics.forEach((m) => {
      this.logger.debug(
        `Node ${m.nodeId} - items: ${m.itemsCount}, executeLocalMs: ${m.executeLocalMs}, delegateRemoteMs: ${m.delegateRemoteMs}, success: ${m.success}`,
      );
    });
  }

  private async delegateWithRetry<T>(
    nodeId: string,
    items: T[],
    delegateRemote: (nodeId: string, items: T[]) => Promise<void>,
    retry: number,
    timeoutMs?: number,
  ): Promise<void> {
    let attempt = 0;
    while (attempt <= retry) {
      try {
        if (timeoutMs) {
          await this.withTimeout(delegateRemote(nodeId, items), timeoutMs);
        } else {
          await delegateRemote(nodeId, items);
        }
        return;
      } catch (err) {
        attempt++;
        this.logger.warn(`Retry ${attempt} for node ${nodeId}`, {
          error: err,
          items,
        });
        if (attempt > retry) throw err;
      }
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timeout after ${ms}ms`)),
        ms,
      );
      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
