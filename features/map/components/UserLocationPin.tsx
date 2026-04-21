"use client";

export function UserLocationPin() {
  return (
    <div
      className="pointer-events-none relative"
      // eslint-disable-next-line local-rules/no-hardcoded-jsx-strings
      aria-label="Tu ubicación"
      data-testid="user-location-pin"
    >
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/15 ring-1 ring-brand-accent/30" />
      <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/40 animate-pulse-pin" />
      <div className="relative h-4 w-4 rounded-full border-2 border-white bg-brand-accent shadow-md" />
    </div>
  );
}
