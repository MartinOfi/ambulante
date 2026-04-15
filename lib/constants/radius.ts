export const RADIUS_OPTIONS = [
  { value: 1000, label: "1km" },
  { value: 2000, label: "2km" },
  { value: 5000, label: "5km" },
] as const;

export type RadiusValue = (typeof RADIUS_OPTIONS)[number]["value"];

export const DEFAULT_RADIUS: RadiusValue = 2000;
