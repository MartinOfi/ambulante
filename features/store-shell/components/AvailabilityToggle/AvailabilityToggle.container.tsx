"use client";

import { useAvailability } from "@/features/store-shell/hooks/useAvailability";
import { useLocationPublishing } from "@/features/store-shell/hooks/useLocationPublishing";
import { AvailabilityToggle } from "./AvailabilityToggle";

export function AvailabilityToggleContainer() {
  const { isAvailable, toggle } = useAvailability();
  const { locationStatus } = useLocationPublishing();

  return (
    <AvailabilityToggle
      isAvailable={isAvailable}
      locationStatus={locationStatus}
      onToggle={toggle}
    />
  );
}
