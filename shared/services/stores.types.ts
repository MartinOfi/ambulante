import type { Store } from "@/shared/schemas/store";
import type { Coordinates } from "@/shared/schemas/coordinates";
import type { FindNearbyInput } from "@/shared/repositories/store";

export type { FindNearbyInput };

export interface StoresService {
  findNearby(input: FindNearbyInput): Promise<readonly Store[]>;
  findById(id: string): Promise<Store | null>;
  findByOwnerId(userId: string): Promise<Store | null>;
  updateLocation(storeId: string, coords: Coordinates): Promise<void>;
}
