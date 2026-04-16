import type { ElementType } from "react";
import { cn } from "@/shared/utils/cn";
import type { PolymorphicProps } from "../polymorphic.types";

type ScreenProps<T extends ElementType = "div"> = PolymorphicProps<T>;

export function Screen<T extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: ScreenProps<T>) {
  // Cast is safe: PolymorphicProps ensures the rest props match the element's type.
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      className={cn(
        "min-h-screen overflow-y-auto",
        // Safe-area insets ensure content is never hidden behind notches / home bars.
        "pb-safe pt-safe",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
