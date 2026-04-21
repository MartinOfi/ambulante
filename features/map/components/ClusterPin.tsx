export interface ClusterPinProps {
  readonly count: number;
  readonly onClick: () => void;
}

export function ClusterPin({ count, onClick }: ClusterPinProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-primary text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
      aria-label={`${count} tiendas agrupadas — tocá para expandir`}
    >
      {count}
    </button>
  );
}
