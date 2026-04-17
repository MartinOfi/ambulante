"use client";

import { lazy, Suspense } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ICON_COLOR,
  ICON_SIZE,
  ICON_STROKE_WIDTH,
  type IconName,
  type IconProps,
} from "./Icon.types";

// Module-level cache avoids re-creating lazy() on each render for the same icon name.
const iconCache = new Map<IconName, ReturnType<typeof lazy<LucideIcon>>>();

function getCachedIcon(name: IconName): ReturnType<typeof lazy<LucideIcon>> {
  if (!iconCache.has(name)) {
    iconCache.set(
      name,
      lazy(() =>
        import("lucide-react").then((mod) => ({
          // The cast is safe: we constrain `name` to `IconName` (LucideIcon keys only).
          default: mod[name] as LucideIcon,
        })),
      ),
    );
  }
  // Non-null assertion: we just set it above if absent.
  return iconCache.get(name)!;
}

export function Icon({
  name,
  size = "md",
  color = "inherit",
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const LazyIcon = getCachedIcon(name);
  const pixelSize = ICON_SIZE[size];
  const colorValue = ICON_COLOR[color];
  const fallbackStyle = {
    display: "inline-block",
    width: pixelSize,
    height: pixelSize,
  } as const;

  return (
    <Suspense fallback={<span style={fallbackStyle} />}>
      <LazyIcon
        width={pixelSize}
        height={pixelSize}
        color={colorValue}
        strokeWidth={ICON_STROKE_WIDTH}
        className={className}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
      />
    </Suspense>
  );
}
