import { storeRepository } from "@/shared/repositories";
import type { StoresService, FindNearbyInput } from "./stores.types";

export type { FindNearbyInput, StoresService };

export const storesService: StoresService = {
  findNearby: (input: FindNearbyInput) => storeRepository.findNearby(input),
  findById: (id: string) => storeRepository.findById(id),
};
