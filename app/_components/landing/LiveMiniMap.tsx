import {
  UtensilsCrossed,
  Coffee,
  Flower2,
  IceCream,
  Palette,
} from "lucide-react";

type VendorState = "active" | "pulsing" | "fading";

interface MapVendor {
  id: string;
  /** Percent-based position on the map viewport (0-100). */
  x: number;
  y: number;
  name: string;
  distance: string;
  icon: React.ComponentType<{ className?: string }>;
  state: VendorState;
  /** Which side the floating label sits on. */
  labelSide: "left" | "right";
}

const MAP_VENDORS: readonly MapVendor[] = [
  {
    id: "chori",
    x: 32,
    y: 28,
    name: "El Rey del Choripán",
    distance: "320 m",
    icon: UtensilsCrossed,
    state: "pulsing",
    labelSide: "right",
  },
  {
    id: "flores",
    x: 72,
    y: 40,
    name: "Flores de Palermo",
    distance: "1.2 km",
    icon: Flower2,
    state: "active",
    labelSide: "left",
  },
  {
    id: "helado",
    x: 24,
    y: 68,
    name: "Heladería Rodante",
    distance: "450 m",
    icon: IceCream,
    state: "active",
    labelSide: "right",
  },
  {
    id: "arte",
    x: 78,
    y: 72,
    name: "Artesanías Don Pepe",
    distance: "800 m",
    icon: Palette,
    state: "active",
    labelSide: "left",
  },
  {
    id: "cafe",
    x: 56,
    y: 18,
    name: "Café Móvil",
    distance: "1.5 km",
    icon: Coffee,
    state: "fading",
    labelSide: "right",
  },
];

export function LiveMiniMap() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/5 p-6 shadow-2xl backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl"
      />

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand amb-live-blink" />
          </span>
          <span className="font-display text-[11px] font-bold uppercase tracking-wider text-brand">
            En vivo
          </span>
          <span className="text-[11px] text-muted">· actualizado ahora</span>
        </div>
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted">
          Radio 2 km
        </span>
      </div>

      <MapCanvas />

      <div className="relative z-10 mt-5 flex items-center justify-between gap-2">
        <MicroBadge>Sin pagos</MicroBadge>
        <MicroBadge>PWA</MicroBadge>
        <MicroBadge>Gratis</MicroBadge>
      </div>
    </div>
  );
}

function MapCanvas() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="street-grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-foreground/25"
            />
          </pattern>
          <radialGradient id="map-vignette" cx="50%" cy="50%" r="60%">
            <stop offset="60%" stopColor="transparent" />
            <stop
              offset="100%"
              stopColor="currentColor"
              stopOpacity="0.25"
              className="text-foreground"
            />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill="url(#street-grid)" />

        <line
          x1="0"
          y1="35"
          x2="100"
          y2="45"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-foreground/20"
        />
        <line
          x1="35"
          y1="0"
          x2="45"
          y2="100"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-foreground/20"
        />
        <line
          x1="0"
          y1="78"
          x2="100"
          y2="72"
          stroke="currentColor"
          strokeWidth="0.4"
          className="text-foreground/15"
        />

        <circle
          cx="50"
          cy="50"
          r="36"
          fill="currentColor"
          className="text-brand/[0.05]"
        />
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          strokeDasharray="1.2 1.6"
          className="text-brand/50"
        />

        <rect width="100" height="100" fill="url(#map-vignette)" />
      </svg>

      <UserMarker />

      {MAP_VENDORS.map((vendor) => (
        <VendorMarker key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}

function UserMarker() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative flex items-center justify-center">
        <span className="amb-radar absolute h-16 w-16 rounded-full bg-brand-accent/30" />
        <span className="amb-radar amb-radar-delay absolute h-16 w-16 rounded-full bg-brand-accent/25" />
        <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent ring-4 ring-surface">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}

interface VendorMarkerProps {
  vendor: MapVendor;
}

function VendorMarker({ vendor }: VendorMarkerProps) {
  const { x, y, icon: Icon, name, distance, state, labelSide } = vendor;

  const stateClass =
    state === "pulsing"
      ? "amb-pin-pulse"
      : state === "fading"
        ? "amb-pin-fade"
        : "";

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
          className={`relative flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 ring-2 ring-surface ${stateClass}`}
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
          {name.split(" ").slice(0, 2).join(" ")}
          <span className="ml-1 text-muted">· {distance}</span>
        </span>
      </div>
    </div>
  );
}

function MicroBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex flex-1 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}
