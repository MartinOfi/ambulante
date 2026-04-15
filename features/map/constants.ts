import type { RadiusValue } from "@/shared/constants/radius";

/**
 * Radio al que se expande la búsqueda cuando el usuario pide "ampliar" desde el
 * EmptyRadius bottom sheet. Máximo disponible en RADIUS_OPTIONS.
 */
export const MAX_EXPAND_RADIUS: RadiusValue = 5000;

export const BOTTOM_SHEET_SNAP = {
  COLLAPSED: "collapsed",
  HALF: "half",
  FULL: "full",
} as const;

export type BottomSheetSnap = (typeof BOTTOM_SHEET_SNAP)[keyof typeof BOTTOM_SHEET_SNAP];
