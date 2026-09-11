import { Injectable, Scope } from '@nestjs/common';
import { RequestContextService } from '../context/request-context.service';

import { LogMeta, RequestContext } from 'src/types/requestContext';
import { Logger } from '@/shared/logger/winston.logger';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private contextName = 'AppLogger';

  constructor(private readonly context: RequestContextService) {}

  setContext(contextName: string) {
    this.contextName = contextName;
  }

  private getBaseMeta(): Record<string, string | null> {
    const store = (this.context.getContext() ?? {}) as Partial<RequestContext>;
    return {
      requestId: store.requestId?.toString() ?? null,
      userId: store.userId?.toString() ?? null,
      ip: store.ip ?? null,
      deviceId: store.deviceId?.toString() ?? null,
      geo: store?.geo ? JSON.stringify(store.geo) : null,
      contextName: this.contextName,
      timestamp: new Date().toISOString(),
    };
  }

  private logWithLevel(
    level: keyof typeof Logger.levels,
    message: string,
    meta?: LogMeta | Error | Record<string, any>,
  ) {
    const context = this.getBaseMeta();
    let extra: Record<string, any> = {};

    if (meta instanceof Error) {
      extra = {
        errorMessage: meta.message,
        stack: meta.stack,
      };
    } else if (meta) {
      extra = Object.fromEntries(
        Object.entries(meta).map(([k, v]) => [
          k,
          v !== null && v !== undefined ? v.toString() : null,
        ]),
      );
    }

    Logger.log(level as string, message, { context, extra });
  }

  log(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('info', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('debug', message, meta);
  }

  verbose(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('verbose', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('warn', message, meta);
  }

  error(message: string | Error, meta?: Record<string, unknown>) {
    const err = message instanceof Error ? message : new Error(message);
    const errorInfo = {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause?.toString() ?? null,
    };
    this.logWithLevel('error', err.message, { error: errorInfo, ...meta });
  }

  http(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('http', message, meta);
  }
}
