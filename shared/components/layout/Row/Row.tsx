import type { ElementType } from "react";
import { cn } from "@/shared/utils/cn";
import type { PolymorphicProps } from "@/shared/components/layout/polymorphic.types";
import { ALIGN_CLASS, GAP_CLASS, JUSTIFY_CLASS } from "@/shared/components/layout/layout.types";
import type { AlignItems, GapScale, JustifyContent } from "@/shared/components/layout/layout.types";

interface RowOwnProps {
  gap?: GapScale;
  align?: AlignItems;
  justify?: JustifyContent;
  wrap?: boolean;
}

type RowProps<T extends ElementType = "div"> = PolymorphicProps<T, RowOwnProps>;

export function Row<T extends ElementType = "div">({
  as,
  gap,
  align,
  justify,
  wrap = false,
  className,
  children,
  ...rest
}: RowProps<T>) {
  // Cast is safe: PolymorphicProps ensures the rest props match the element's type.
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      className={cn(
        "flex flex-row",
        gap !== undefined && GAP_CLASS[gap],
        align && ALIGN_CLASS[align],
        justify && JUSTIFY_CLASS[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
