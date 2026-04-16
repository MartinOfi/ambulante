import { create } from "zustand";
import { persist } from "zustand/middleware";

const AVAILABILITY_STORE_KEY = "ambulante-store-availability" as const;

interface AvailabilityState {
  readonly isAvailable: boolean;
}

interface AvailabilityActions {
  toggleAvailability: () => void;
  setAvailable: (value: boolean) => void;
}

type AvailabilityStore = AvailabilityState & AvailabilityActions;

const INITIAL_STATE: AvailabilityState = {
  isAvailable: false,
};

export const useAvailabilityStore = create<AvailabilityStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      toggleAvailability: () => set((state) => ({ ...state, isAvailable: !state.isAvailable })),
      setAvailable: (value) => set((state) => ({ ...state, isAvailable: value })),
    }),
    {
      name: AVAILABILITY_STORE_KEY,
      partialize: (state): AvailabilityState => ({
        isAvailable: state.isAvailable,
      }),
    },
  ),
);
