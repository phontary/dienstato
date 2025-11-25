/**
 * Simple event emitter for server-sent events
 * Allows broadcasting changes across API routes to connected SSE clients
 */

type EventCallback = (data: unknown) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, data: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// Global singleton instance
export const eventEmitter = new EventEmitter();

// Event types
export type CalendarChangeEvent = {
  type: "shift" | "preset" | "note" | "calendar";
  action: "create" | "update" | "delete";
  calendarId: string;
  data?: unknown;
};
