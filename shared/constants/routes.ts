/**
 * Centralized route constants for the Ambulante app.
 *
 * Why: "/map" and similar strings were repeated in 8+ places.
 * Any rename was invisible to the compiler and broke silently at runtime.
 *
 * Usage:
 *   import { ROUTES, buildHref } from "@/shared/constants/routes";
 *
 *   <Link href={ROUTES.client.map} />
 *   <Link href={buildHref(ROUTES.store.order, { orderId: "abc" })} />
 */

export const ROUTES = {
  public: {
    home: "/",
  },
  client: {
    map: "/map",
    orders: "/orders",
    profile: "/profile",
  },
  store: {
    dashboard: "/store/dashboard",
    order: "/store/order/:orderId",
  },
  admin: {
    dashboard: "/admin/dashboard",
  },
} as const;

/**
 * All leaf route strings derived from ROUTES.
 * Use this type when a function accepts any app route.
 */
export type Route = LeafValues<typeof ROUTES>;

type LeafValues<T> = T extends string ? T : T extends object ? LeafValues<T[keyof T]> : never;

/**
 * Interpolates `:param` placeholders in a route template.
 *
 * @param template - A route string, potentially containing `:param` segments.
 * @param params - An object mapping each param name to its value.
 * @returns The resolved URL string.
 *
 * @throws If a required param placeholder has no corresponding value.
 *
 * @example
 *   buildHref(ROUTES.store.order, { orderId: "abc-123" })
 *   // → "/store/order/abc-123"
 */
export function buildHref(template: string, params?: Record<string, string>): string {
  if (!params) {
    return template;
  }

  return template.replace(/:([a-zA-Z]+)/g, (_match, paramName: string) => {
    const value = params[paramName];
    if (!value) {
      throw new Error(
        `buildHref: param "${paramName}" must be a non-empty string in template "${template}"`,
      );
    }
    return value;
  });
}
