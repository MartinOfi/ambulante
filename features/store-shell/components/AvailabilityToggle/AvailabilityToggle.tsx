import { cn } from "@/shared/utils/cn";

export interface AvailabilityToggleProps {
  readonly isAvailable: boolean;
  readonly onToggle: () => void;
}

export function AvailabilityToggle({ isAvailable, onToggle }: AvailabilityToggleProps) {
  return (
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
  );
}
