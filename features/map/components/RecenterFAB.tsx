"use client";

import { LocateFixed } from "lucide-react";

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export function RecenterFAB({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Recentrar en mi ubicación"
      className="absolute right-4 z-10 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-fab ring-4 ring-surface transition-transform duration-200 active:scale-95 disabled:opacity-50"
      style={{ bottom: "calc(45vh + 16px)" }}
    >
      <LocateFixed className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
