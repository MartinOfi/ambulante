import type { ComponentPropsWithoutRef, ElementType } from "react";

/**
 * Utility type for polymorphic components that accept an `as` prop to change
 * the rendered HTML element while preserving the correct attribute types.
 *
 * Why needed: TypeScript cannot infer that props spread onto a dynamic Tag
 * element are valid. This type bridges the gap with a generic constraint.
 */
export type PolymorphicProps<
  TElement extends ElementType,
  TExtraProps extends object = object,
> = TExtraProps &
  Omit<ComponentPropsWithoutRef<TElement>, keyof TExtraProps | "as"> & {
    /** Override the rendered HTML element. Defaults per component. */
    as?: TElement;
  };
