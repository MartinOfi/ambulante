import { cn } from "@/shared/utils/cn";

type SpacerSize = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
type SpacerAxis = "vertical" | "horizontal";

const HEIGHT_CLASS: Record<SpacerSize, string> = {
  1: "h-1",
  2: "h-2",
  3: "h-3",
  4: "h-4",
  5: "h-5",
  6: "h-6",
  8: "h-8",
  10: "h-10",
  12: "h-12",
  16: "h-16",
};

const WIDTH_CLASS: Record<SpacerSize, string> = {
  1: "w-1",
  2: "w-2",
  3: "w-3",
  4: "w-4",
  5: "w-5",
  6: "w-6",
  8: "w-8",
  10: "w-10",
  12: "w-12",
  16: "w-16",
};

interface SpacerProps {
  size: SpacerSize;
  /** Axis along which the spacer expands. Defaults to "vertical". */
  axis?: SpacerAxis;
  className?: string;
}

export function Spacer({ size, axis = "vertical", className }: SpacerProps) {
  const sizeClass =
    axis === "horizontal" ? WIDTH_CLASS[size] : HEIGHT_CLASS[size];

  return (
    <div
      aria-hidden="true"
      className={cn("flex-shrink-0", sizeClass, className)}
    />
  );
}
