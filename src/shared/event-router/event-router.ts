import { AppEvent, EventHandler, EventRegistry } from '@/types/events/base.event';
import { StreamMessage } from '@/shared/redis-cluster/redis-stream.service';

export class EventRouter {
  private handlers = new Map<string, EventHandler<any>>();

  public register<T extends AppEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
  ) {
    this.handlers.set(eventType, handler);
  }

  public async route(event: AppEvent, raw: StreamMessage): Promise<void> {
    if (!event.type || !event.version) {
      throw new Error(`Malformed event: missing type or version. payload: ${JSON.stringify(event)}`);
    }

    const validVersions = EventRegistry[event.type as keyof typeof EventRegistry];
    if (!validVersions) {
      throw new Error(`Unregistered event type: ${event.type}`);
    }

    if (!validVersions.includes(event.version as never)) {
      throw new Error(`Unsupported version ${event.version} for event ${event.type}`);
    }

    const handler = this.handlers.get(event.type);
    if (!handler) {
      throw new Error(`No handler registered for event type: ${event.type}`);
    }

    // Forward raw so handlers can access seq = raw.id (Redis Stream ID)
    await handler(event, raw);
  }
}
