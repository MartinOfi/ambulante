export function UserMarker() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative flex items-center justify-center">
        <span className="amb-radar absolute size-16 rounded-full bg-brand-accent/30" />
        <span className="amb-radar amb-radar-delay absolute size-16 rounded-full bg-brand-accent/25" />
        <span className="relative flex size-4 items-center justify-center rounded-full bg-brand-accent ring-4 ring-surface">
          <span className="size-1.5 rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}
