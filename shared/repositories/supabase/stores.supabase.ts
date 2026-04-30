import type { Store } from "@/shared/schemas/store";
import type {
  StoreRepository,
  StoreFilters,
  FindNearbyInput,
  CreateStoreInput,
  UpdateStoreInput,
} from "@/shared/repositories/store";
import type { SupabaseClient } from "./client";
import { mapStoreRow, dbAvailableToStatus, type DbStoreViewRow } from "./mappers";

const STORES_VIEW_SELECT =
  "public_id, owner_public_id, name, description, category, available, photo_url, tagline, price_from_ars, hours, lat, lng, cuit";

export class SupabaseStoreRepository implements StoreRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(filters?: StoreFilters): Promise<readonly Store[]> {
    let query = this.client.from("stores_view").select(STORES_VIEW_SELECT);

    if (filters?.status === "stale") {
      throw new Error("SupabaseStoreRepository.findAll: 'stale' cannot be filtered server-side");
    }
    if (filters?.status !== undefined) {
      query = query.eq("available", filters.status === "open");
    }

    const { data, error } = await query;
    if (error !== null) throw new Error(`SupabaseStoreRepository.findAll: ${error.message}`);
    return (data as DbStoreViewRow[]).map(mapStoreRow);
  }

  async findById(id: string): Promise<Store | null> {
    const { data, error } = await this.client
      .from("stores_view")
      .select(STORES_VIEW_SELECT)
      .eq("public_id", id)
      .maybeSingle();

    if (error !== null) throw new Error(`SupabaseStoreRepository.findById: ${error.message}`);
    if (data === null) return null;
    return mapStoreRow(data as DbStoreViewRow);
  }

  async findByOwnerId(userId: string): Promise<Store | null> {
    const { data, error } = await this.client
      .from("stores_view")
      .select(STORES_VIEW_SELECT)
      .eq("owner_public_id", userId)
      .maybeSingle();

    if (error !== null) throw new Error(`SupabaseStoreRepository.findByOwnerId: ${error.message}`);
    if (data === null) return null;
    return mapStoreRow(data as DbStoreViewRow);
  }

  async findNearby({ coords, radiusMeters }: FindNearbyInput): Promise<readonly Store[]> {
    const { data, error } = await this.client.rpc("find_stores_nearby", {
      p_lat: coords.lat,
      p_lng: coords.lng,
      p_radius_meters: radiusMeters,
    });

    if (error !== null) throw new Error(`SupabaseStoreRepository.findNearby: ${error.message}`);

    return (data as DbStoreViewRow[]).map((row) =>
      mapStoreRow({
        ...row,
        distance_meters: (row as DbStoreViewRow & { distance_meters?: number }).distance_meters,
      }),
    );
  }

  async create(input: CreateStoreInput): Promise<Store> {
    const { data: ownerRow, error: ownerError } = await this.client
      .from("users")
      .select("id")
      .eq("public_id", input.ownerId)
      .single();

    if (ownerError !== null || ownerRow === null) {
      throw new Error(`SupabaseStoreRepository.create: owner not found (${input.ownerId})`);
    }
    const ownerId = Number(ownerRow.id);
    if (!Number.isFinite(ownerId)) {
      throw new Error(
        `SupabaseStoreRepository.create: unexpected owner id value "${String(ownerRow.id)}"`,
      );
    }

    const { data, error } = await this.client
      .from("stores")
      .insert({
        public_id: input.id,
        owner_id: ownerId,
        name: input.name,
        description: input.description ?? null,
        category: input.kind,
        available: input.status === "open",
        photo_url: input.photoUrl,
        tagline: input.tagline,
        price_from_ars: input.priceFromArs,
        hours: input.hours ?? null,
        cuit: input.cuit ?? null,
      })
      .select("public_id, owner_id")
      .single();

    if (error !== null) throw new Error(`SupabaseStoreRepository.create: ${error.message}`);

    // Re-fetch from view to get owner_public_id and computed lat/lng
    const created = await this.findById(data.public_id);
    if (created === null)
      throw new Error("SupabaseStoreRepository.create: could not re-fetch created store");
    return created;
  }

  async update(id: string, input: UpdateStoreInput): Promise<Store> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.kind !== undefined) patch.category = input.kind;
    if (input.status !== undefined) patch.available = input.status === "open";
    if (input.photoUrl !== undefined) patch.photo_url = input.photoUrl;
    if (input.tagline !== undefined) patch.tagline = input.tagline;
    if (input.priceFromArs !== undefined) patch.price_from_ars = input.priceFromArs;
    if (input.hours !== undefined) patch.hours = input.hours;

    const { error } = await this.client.from("stores").update(patch).eq("public_id", id);

    if (error !== null) throw new Error(`SupabaseStoreRepository.update: ${error.message}`);

    const updated = await this.findById(id);
    if (updated === null)
      throw new Error(`SupabaseStoreRepository.update: store ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("stores").delete().eq("public_id", id);
    if (error !== null) throw new Error(`SupabaseStoreRepository.delete: ${error.message}`);
  }
}

// ── Status filter helper (used in findAll) ─────────────────────────────────────
// `stale` cannot be filtered server-side without a location timestamp column;
// it's derived client-side via the realtime stream (PRD §7.5).
export { dbAvailableToStatus };
