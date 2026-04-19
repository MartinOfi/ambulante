import { cn } from "@/shared/utils/cn";
import type { LocationPublishingStatus } from "@/features/store-shell/hooks/useLocationPublishing";

const LOCATION_STATUS_LABEL: Record<LocationPublishingStatus, string> = {
  idle: "",
  publishing: "GPS activo",
  stale: "GPS desactualizado",
  error: "Error de GPS",
};

const LOCATION_STATUS_COLOR: Record<LocationPublishingStatus, string> = {
  idle: "",
  publishing: "text-green-600",
  stale: "text-yellow-600",
  error: "text-destructive",
};

export interface AvailabilityToggleProps {
  readonly isAvailable: boolean;
  readonly locationStatus?: LocationPublishingStatus;
  readonly onToggle: () => void;
}

export function AvailabilityToggle({
  isAvailable,
  locationStatus,
  onToggle,
}: AvailabilityToggleProps) {
  const locationLabel = locationStatus ? LOCATION_STATUS_LABEL[locationStatus] : "";
  const locationColor = locationStatus ? LOCATION_STATUS_COLOR[locationStatus] : "";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          role="switch"
          aria-checked={isAvailable}
          aria-label={isAvailable ? "Disponible" : "No disponible"}
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isAvailable ? "bg-green-500" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              isAvailable ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
        <span className="text-sm font-medium" aria-hidden="true">
          {isAvailable ? "Disponible" : "No disponible"}
        </span>
      </div>
      {locationLabel && (
        <span className={cn("text-xs", locationColor)} aria-live="polite">
          {locationLabel}
        </span>
      )}
    </div>
  );
}
