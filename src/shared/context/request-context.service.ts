import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from 'src/types/requestContext';

export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  get<T extends keyof RequestContext>(key: T): RequestContext[T] | undefined {
    const store = this.asyncLocalStorage.getStore();
    return store?.[key];
  }

  set<T extends keyof RequestContext>(key: T, value: RequestContext[T]): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      store[key] = value;
    }
  }

  // getAll(): RequestContext | undefined {
  //   return this.asyncLocalStorage.getStore();
  // }

  getContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
