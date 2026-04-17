"use client";

import { Component, lazy, Suspense, type ReactNode } from "react";
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
        import("lucide-react").then((mod) => {
          const component = mod[name];
          if (component == null) {
            // Shouldn't happen: IconName is derived from lucide's own exports.
            // Guards against version skew between dev and prod bundles.
            throw new Error(`Icon "${name}" not found in lucide-react`);
          }
          // Safe: constrained to IconName (LucideIcon keys only) + null guard above.
          // lucide uses React.forwardRef(), so typeof is "object", not "function".
          return { default: component as LucideIcon };
        }),
      ),
    );
  }
  // Non-null assertion: we just set it above if absent.
  return iconCache.get(name)!;
}

interface IconErrorBoundaryProps {
  readonly fallback: ReactNode;
  readonly children: ReactNode;
}

interface IconErrorBoundaryState {
  readonly failed: boolean;
}

class IconErrorBoundary extends Component<IconErrorBoundaryProps, IconErrorBoundaryState> {
  state: IconErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): IconErrorBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
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
  const fallback = <span style={fallbackStyle} aria-hidden="true" />;

  return (
    <IconErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
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
    </IconErrorBoundary>
  );
}
