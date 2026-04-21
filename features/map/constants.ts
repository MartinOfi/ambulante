import type { RadiusValue } from "@/shared/constants/radius";
import type { Coordinates } from "@/shared/schemas/coordinates";

/**
 * Radio al que se expande la búsqueda cuando el usuario pide "ampliar" desde el
 * EmptyRadius bottom sheet. Máximo disponible en RADIUS_OPTIONS.
 */
export const MAX_EXPAND_RADIUS: RadiusValue = 5000;

/** Buenos Aires city center — fallback when user location is unavailable */
export const MAP_DEFAULTS = {
  CENTER: { lat: -34.6037, lng: -58.3816 } satisfies Coordinates,
  ZOOM: 14,
  MIN_ZOOM: 10,
  MAX_ZOOM: 20,
} as const;

export const BOTTOM_SHEET_SNAP = {
  COLLAPSED: "collapsed",
  HALF: "half",
  FULL: "full",
} as const;

export type BottomSheetSnap = (typeof BOTTOM_SHEET_SNAP)[keyof typeof BOTTOM_SHEET_SNAP];
