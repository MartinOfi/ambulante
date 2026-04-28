import type {
  PushSubscriptionRepository,
  PushSubscription,
  PushSubscriptionFilters,
  CreatePushSubscriptionInput,
  UpdatePushSubscriptionInput,
} from "@/shared/repositories/push-subscriptions";
import type { SupabaseClient } from "./client";
import { mapPushSubscriptionRow, type DbPushSubscriptionRow } from "./mappers";

const PUSH_SELECT =
  "id, endpoint, p256dh, auth_key, user_agent, created_at, user:users!user_id(public_id)";

export class SupabasePushSubscriptionRepository implements PushSubscriptionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(filters?: PushSubscriptionFilters): Promise<readonly PushSubscription[]> {
    let query = this.client.from("push_subscriptions").select(PUSH_SELECT);

    if (filters?.userId !== undefined) {
      const internalId = await this.resolveUserInternalId(filters.userId);
      query = query.eq("user_id", internalId);
    }

    const { data, error } = await query;
    if (error !== null)
      throw new Error(`SupabasePushSubscriptionRepository.findAll: ${error.message}`);
    return (data as unknown as DbPushSubscriptionRow[]).map(mapPushSubscriptionRow);
  }

  async findById(id: string): Promise<PushSubscription | null> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId))
      throw new Error(`SupabasePushSubscriptionRepository.findById: invalid id "${id}"`);
    const { data, error } = await this.client
      .from("push_subscriptions")
      .select(PUSH_SELECT)
      .eq("id", numericId)
      .maybeSingle();

    if (error !== null)
      throw new Error(`SupabasePushSubscriptionRepository.findById: ${error.message}`);
    if (data === null) return null;
    return mapPushSubscriptionRow(data as unknown as DbPushSubscriptionRow);
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const { data, error } = await this.client
      .from("push_subscriptions")
      .select(PUSH_SELECT)
      .eq("endpoint", endpoint)
      .maybeSingle();

    if (error !== null)
      throw new Error(`SupabasePushSubscriptionRepository.findByEndpoint: ${error.message}`);
    if (data === null) return null;
    return mapPushSubscriptionRow(data as unknown as DbPushSubscriptionRow);
  }

  async upsertByEndpoint(input: CreatePushSubscriptionInput): Promise<PushSubscription> {
    const internalId = await this.resolveUserInternalId(input.userId);

    const { data, error } = await this.client
      .from("push_subscriptions")
      .upsert(
        {
          user_id: internalId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth_key: input.authKey,
          user_agent: input.userAgent ?? null,
        },
        { onConflict: "endpoint" },
      )
      .select(PUSH_SELECT)
      .single();

    if (error !== null)
      throw new Error(`SupabasePushSubscriptionRepository.upsertByEndpoint: ${error.message}`);
    return mapPushSubscriptionRow(data as unknown as DbPushSubscriptionRow);
  }

  async create(input: CreatePushSubscriptionInput): Promise<PushSubscription> {
    return this.upsertByEndpoint(input);
  }

  async update(id: string, input: UpdatePushSubscriptionInput): Promise<PushSubscription> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId))
      throw new Error(`SupabasePushSubscriptionRepository.update: invalid id "${id}"`);
    const { data, error } = await this.client
      .from("push_subscriptions")
      .update({ p256dh: input.p256dh, auth_key: input.authKey })
      .eq("id", numericId)
      .select(PUSH_SELECT)
      .single();

    if (error !== null)
      throw new Error(`SupabasePushSubscriptionRepository.update: ${error.message}`);
    return mapPushSubscriptionRow(data as unknown as DbPushSubscriptionRow);
  }

  async delete(id: string): Promise<void> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId))
      throw new Error(`SupabasePushSubscriptionRepository.delete: invalid id "${id}"`);
    const { error } = await this.client.from("push_subscriptions").delete().eq("id", numericId);

    if (error !== null)
      throw new Error(`SupabasePushSubscriptionRepository.delete: ${error.message}`);
  }

  private async resolveUserInternalId(publicId: string): Promise<number> {
    const { data, error } = await this.client
      .from("users")
      .select("id")
      .eq("public_id", publicId)
      .single();

    if (error !== null || data === null) {
      throw new Error(`SupabasePushSubscriptionRepository: user not found (${publicId})`);
    }
    const userId = Number(data.id);
    if (!Number.isFinite(userId)) {
      throw new Error(
        `SupabasePushSubscriptionRepository: unexpected user id value "${String(data.id)}"`,
      );
    }
    return userId;
  }
}
