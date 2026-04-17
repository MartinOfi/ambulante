import type { ElementType } from "react";
import { cn } from "@/shared/utils/cn";
import type { PolymorphicProps } from "@/shared/components/layout/polymorphic.types";

export type TextVariant =
  | "display-xl"
  | "display-lg"
  | "heading-sm"
  | "body"
  | "body-sm"
  | "overline"
  | "caption";

const VARIANT_CLASSES: Record<TextVariant, string> = {
  "display-xl":
    "font-display text-5xl font-bold uppercase leading-[0.9] tracking-[-0.03em] sm:text-6xl lg:text-7xl xl:text-8xl",
  "display-lg":
    "font-display text-[clamp(2rem,6vw,3.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]",
  "heading-sm": "font-display text-lg font-bold",
  body: "text-lg leading-relaxed",
  "body-sm": "text-sm leading-relaxed",
  overline: "font-display text-xs font-bold uppercase tracking-[0.2em]",
  caption: "text-xs",
};

const VARIANT_DEFAULT_ELEMENT: Record<TextVariant, ElementType> = {
  "display-xl": "h1",
  "display-lg": "h2",
  "heading-sm": "h3",
  body: "p",
  "body-sm": "p",
  overline: "span",
  caption: "span",
};

interface TextOwnProps {
  variant: TextVariant;
}

type TextProps<T extends ElementType = ElementType> = PolymorphicProps<T, TextOwnProps>;

export function Text<T extends ElementType = ElementType>({
  as,
  variant,
  className,
  children,
  ...rest
}: TextProps<T>) {
  const Tag = (as ?? VARIANT_DEFAULT_ELEMENT[variant]) as ElementType;

  return (
    <Tag className={cn(VARIANT_CLASSES[variant], className)} {...rest}>
      {children}
    </Tag>
  );
}
