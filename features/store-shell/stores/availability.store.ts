import { create } from "zustand";

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

export const useAvailabilityStore = create<AvailabilityStore>()((set) => ({
  ...INITIAL_STATE,
  toggleAvailability: () => set((state) => ({ isAvailable: !state.isAvailable })),
  setAvailable: (value) => set({ isAvailable: value }),
}));
