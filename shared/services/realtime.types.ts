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
  /** @internal — test escape hatch; only available on mock implementation */
  _testDeliver(channel: string, event: string, payload: unknown): void;
  /** @internal — test escape hatch; only available on mock implementation */
  _testSetStatus(status: RealtimeStatus): void;
  /** @internal — test escape hatch; triggers offline + starts reconnect loop */
  _testSimulateDisconnect(): void;
}
