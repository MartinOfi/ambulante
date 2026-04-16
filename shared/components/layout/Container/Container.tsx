import type { ElementType } from "react";
import { cn } from "@/shared/utils/cn";
import type { PolymorphicProps } from "../polymorphic.types";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

const SIZE_CLASS: Record<ContainerSize, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  full: "",
};

interface ContainerOwnProps {
  /** Max-width breakpoint. Defaults to "md". */
  size?: ContainerSize;
  /** Applies horizontal padding (px-4) to keep content off screen edges on mobile. */
  padded?: boolean;
}

type ContainerProps<T extends ElementType = "div"> = PolymorphicProps<
  T,
  ContainerOwnProps
>;

export function Container<T extends ElementType = "div">({
  as,
  size = "md",
  padded = false,
  className,
  children,
  ...rest
}: ContainerProps<T>) {
  // Cast is safe: PolymorphicProps ensures the rest props match the element's type.
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      className={cn(
        "mx-auto w-full",
        SIZE_CLASS[size],
        padded && "px-4",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
