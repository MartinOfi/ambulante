import type { Repository } from "./base";

export interface PushSubscription {
  readonly id: string;
  readonly userId: string;
  readonly endpoint: string;
  readonly p256dh: string;
  readonly authKey: string;
  readonly userAgent?: string;
  readonly createdAt: string;
}

export interface PushSubscriptionFilters {
  readonly userId?: string;
}

export type CreatePushSubscriptionInput = Omit<PushSubscription, "id" | "createdAt">;
export type UpdatePushSubscriptionInput = Pick<PushSubscription, "p256dh" | "authKey">;

export interface PushSubscriptionRepository extends Repository<
  PushSubscription,
  CreatePushSubscriptionInput,
  UpdatePushSubscriptionInput,
  PushSubscriptionFilters
> {
  findByEndpoint(endpoint: string): Promise<PushSubscription | null>;
  upsertByEndpoint(input: CreatePushSubscriptionInput): Promise<PushSubscription>;
}
