"use client";

type Props = {
  top?: string;
  left?: string;
};

export function UserLocationPin({ top = "50%", left = "50%" }: Props) {
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ top, left }}
      aria-label="Tu ubicación"
    >
      {/* Radius circle */}
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/15 ring-1 ring-brand-accent/30" />
      {/* Pulse */}
      <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/40 animate-pulse-pin" />
      {/* Dot */}
      <div className="relative h-4 w-4 rounded-full border-2 border-white bg-brand-accent shadow-md" />
    </div>
  );
}
