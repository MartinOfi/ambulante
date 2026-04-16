import type { ElementType } from "react";
import { cn } from "@/shared/utils/cn";
import type { PolymorphicProps } from "../polymorphic.types";

type GapScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
type AlignItems = "start" | "center" | "end" | "stretch" | "baseline";
type JustifyContent = "start" | "center" | "end" | "between" | "around" | "evenly";

const GAP_CLASS: Record<GapScale, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
  16: "gap-16",
};

const ALIGN_CLASS: Record<AlignItems, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const JUSTIFY_CLASS: Record<JustifyContent, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

interface StackOwnProps {
  gap?: GapScale;
  align?: AlignItems;
  justify?: JustifyContent;
}

type StackProps<T extends ElementType = "div"> = PolymorphicProps<T, StackOwnProps>;

export function Stack<T extends ElementType = "div">({
  as,
  gap,
  align,
  justify,
  className,
  children,
  ...rest
}: StackProps<T>) {
  // Cast is safe: PolymorphicProps ensures the rest props match the element's type.
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      className={cn(
        "flex flex-col",
        gap !== undefined && GAP_CLASS[gap],
        align && ALIGN_CLASS[align],
        justify && JUSTIFY_CLASS[justify],
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
