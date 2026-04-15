import { MAP_VENDORS } from "./vendors";
import { UserMarker } from "./UserMarker";
import { VendorMarker } from "./VendorMarker";

export function MapCanvas() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <pattern id="street-grid" width="10" height="10" patternUnits="userSpaceOnUse">
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

        <circle cx="50" cy="50" r="36" fill="currentColor" className="text-brand/[0.05]" />
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
