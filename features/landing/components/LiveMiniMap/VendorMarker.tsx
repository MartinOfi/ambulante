import type { MapVendor, VendorState } from "./vendors";

const STATE_CLASS: Record<VendorState, string> = {
  pulsing: "amb-pin-pulse",
  fading: "amb-pin-fade",
  active: "",
};

const NAME_MAX_WORDS = 2;

interface VendorMarkerProps {
  readonly vendor: MapVendor;
}

export function VendorMarker({ vendor }: VendorMarkerProps) {
  const { x, y, icon: Icon, name, distance, state, labelSide } = vendor;
  const truncatedName = name.split(" ").slice(0, NAME_MAX_WORDS).join(" ");

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      <div
        className={`relative flex items-center ${
          labelSide === "right" ? "flex-row" : "flex-row-reverse"
        } gap-1.5`}
      >
        <span
          className={`relative flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 ring-2 ring-surface ${STATE_CLASS[state]}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {state === "pulsing" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-brand/60" />
          )}
        </span>
        <span
          className={`whitespace-nowrap rounded-full border border-foreground/10 bg-surface/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-tight text-foreground shadow-sm backdrop-blur-sm ${
            state === "fading" ? "opacity-60" : ""
          }`}
        >
          {truncatedName}
          <span className="ml-1 text-muted">· {distance}</span>
        </span>
      </div>
    </div>
  );
}
