import { cn } from "@/shared/utils/cn";

type DividerOrientation = "horizontal" | "vertical";

interface DividerProps {
  orientation?: DividerOrientation;
  className?: string;
}

export function Divider({
  orientation = "horizontal",
  className,
}: DividerProps) {
  return (
    <hr
      className={cn(
        "border-border",
        orientation === "horizontal" ? "border-t w-full" : "border-l h-full",
        className
      )}
    />
  );
}
