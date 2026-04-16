import { useState } from "react";

export interface UseAvailabilityReturn {
  readonly isAvailable: boolean;
  toggle: () => void;
  setAvailable: (value: boolean) => void;
}

export function useAvailability(): UseAvailabilityReturn {
  const [isAvailable, setIsAvailable] = useState(false);

  const toggle = () => setIsAvailable((prev) => !prev);

  return { isAvailable, toggle, setAvailable: setIsAvailable };
}
