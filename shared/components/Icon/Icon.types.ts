import type * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_SIZE = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof ICON_SIZE;

export const ICON_COLOR = {
  inherit: "currentColor",
  brand: "hsl(var(--brand-primary))",
  muted: "hsl(var(--muted))",
  foreground: "hsl(var(--foreground))",
  success: "hsl(var(--success))",
  destructive: "hsl(var(--destructive))",
} as const;

export type IconColor = keyof typeof ICON_COLOR;

// Filter lucide module to only component exports (LucideIcon = ForwardRefExoticComponent).
// This produces a union of ~1450 icon names, giving full autocomplete + typo detection.
export type IconName = {
  [K in keyof typeof LucideIcons]: (typeof LucideIcons)[K] extends LucideIcon ? K : never;
}[keyof typeof LucideIcons];

export const ICON_STROKE_WIDTH = 1.5;

export interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize;
  readonly color?: IconColor;
  readonly className?: string;
  readonly "aria-label"?: string;
  readonly "aria-hidden"?: boolean;
}
