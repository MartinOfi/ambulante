import type { ElementType } from "react";
import { cn } from "@/shared/utils/cn";
import type { PolymorphicProps } from "@/shared/components/layout/polymorphic.types";
import { ALIGN_CLASS, GAP_CLASS, JUSTIFY_CLASS } from "@/shared/components/layout/layout.types";
import type { AlignItems, GapScale, JustifyContent } from "@/shared/components/layout/layout.types";

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
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
