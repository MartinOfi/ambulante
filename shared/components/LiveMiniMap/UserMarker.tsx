export function UserMarker() {
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
