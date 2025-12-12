// Kernel workflow primitives - event system for domain events

export type EventName =
  | "receipt.created"
  | "receipt.confirmed"
  | "invoice.created"
  | "invoice.sent"
  | "invoice.paid"
  | "tax_period.updated"
  | "inbox_item.created"
  | "task.created";

export interface DomainEvent<T = unknown> {
  name: EventName;
  timestamp: Date;
  spaceId: string;
  payload: T;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

class EventBus {
  private handlers: Map<EventName, EventHandler[]> = new Map();

  on<T = unknown>(eventName: EventName, handler: EventHandler<T>) {
    const existing = this.handlers.get(eventName) ?? [];
    this.handlers.set(eventName, [...existing, handler as EventHandler]);
  }

  async emit<T = unknown>(eventName: EventName, spaceId: string, payload: T) {
    const event: DomainEvent<T> = {
      name: eventName,
      timestamp: new Date(),
      spaceId,
      payload,
    };

    const handlers = this.handlers.get(eventName) ?? [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }

  off(eventName: EventName, handler: EventHandler) {
    const handlers = this.handlers.get(eventName) ?? [];
    this.handlers.set(
      eventName,
      handlers.filter((h) => h !== handler)
    );
  }
}

export const eventBus = new EventBus();

export async function emitEvent<T = unknown>(eventName: EventName, spaceId: string, payload: T) {
  await eventBus.emit(eventName, spaceId, payload);
}

export function onEvent<T = unknown>(eventName: EventName, handler: EventHandler<T>) {
  eventBus.on(eventName, handler);
}
