import type { Store, StoreStatus } from "@/shared/schemas/store";
import type { Coordinates } from "@/shared/schemas/coordinates";
import type { Repository } from "./base";

export interface StoreFilters {
  readonly status?: StoreStatus;
}

export interface FindNearbyInput {
  readonly coords: Coordinates;
  readonly radiusMeters: number;
}

export type CreateStoreInput = Store;
export type UpdateStoreInput = Partial<Omit<Store, "id">>;

export interface StoreRepository extends Repository<
  Store,
  CreateStoreInput,
  UpdateStoreInput,
  StoreFilters
> {
  findNearby(input: FindNearbyInput): Promise<readonly Store[]>;
}
