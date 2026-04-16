import type { Store } from "@/shared/schemas/store";
import type { FindNearbyInput } from "@/shared/repositories/store";

export type { FindNearbyInput };

export interface StoresService {
  findNearby(input: FindNearbyInput): Promise<readonly Store[]>;
  findById(id: string): Promise<Store | null>;
}
