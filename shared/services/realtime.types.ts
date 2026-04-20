export type RealtimeStatus = "connecting" | "online" | "offline";

export interface RealtimeMessage<T = unknown> {
  readonly channel: string;
  readonly event: string;
  readonly payload: T;
}

export type RealtimeHandler<T = unknown> = (message: RealtimeMessage<T>) => void;

export type RealtimeStatusHandler = (status: RealtimeStatus) => void;

export interface RealtimeService {
  subscribe<T = unknown>(channel: string, handler: RealtimeHandler<T>): () => void;
  unsubscribe(channel: string): void;
  status(): RealtimeStatus;
  onStatusChange(handler: RealtimeStatusHandler): () => void;
  reconnect(): void;
  destroy(): void;
}

/** Extended interface with test-only escape hatches — only available on the mock implementation. */
export interface TestableRealtimeService extends RealtimeService {
  _testDeliver(channel: string, event: string, payload: unknown): void;
  _testSetStatus(status: RealtimeStatus): void;
  _testSimulateDisconnect(): void;
}
