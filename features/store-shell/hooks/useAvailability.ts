import { useAvailabilityStore } from "@/features/store-shell/stores/availability.store";

export interface UseAvailabilityReturn {
  readonly isAvailable: boolean;
  readonly toggle: () => void;
  readonly setAvailable: (value: boolean) => void;
}

export function useAvailability(): UseAvailabilityReturn {
  const isAvailable = useAvailabilityStore((s) => s.isAvailable);
  const toggle = useAvailabilityStore((s) => s.toggleAvailability);
  const setAvailable = useAvailabilityStore((s) => s.setAvailable);
  return { isAvailable, toggle, setAvailable };
}
