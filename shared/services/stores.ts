import { storeRepository } from "@/shared/repositories";
import type { Coordinates } from "@/shared/schemas/coordinates";
import type { StoresService, FindNearbyInput } from "./stores.types";

export type { FindNearbyInput, StoresService };

export const storesService: StoresService = {
  findNearby: (input: FindNearbyInput) => storeRepository.findNearby(input),
  findById: (id: string) => storeRepository.findById(id),
  findByOwnerId: (userId: string) => storeRepository.findByOwnerId(userId),
  updateLocation: (storeId: string, coords: Coordinates) =>
    storeRepository.update(storeId, { location: coords }).then(() => undefined),
};
