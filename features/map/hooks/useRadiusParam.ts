import { parseAsInteger, useQueryState } from "nuqs";
import { DEFAULT_RADIUS, RADIUS_OPTIONS, type RadiusValue } from "@/shared/constants/radius";

const VALID_RADIUS_VALUES = RADIUS_OPTIONS.map((opt) => opt.value);

function isValidRadius(value: number): value is RadiusValue {
  return (VALID_RADIUS_VALUES as number[]).includes(value);
}

/**
 * Syncs the map radius filter with the URL query param `?r=<meters>`.
 * Falls back to DEFAULT_RADIUS for invalid or missing values.
 * Refresh and link-sharing preserve the selected radius.
 */
export function useRadiusParam(): [RadiusValue, (radius: RadiusValue) => void] {
  const [rawRadius, setRawRadius] = useQueryState(
    "r",
    parseAsInteger.withDefault(DEFAULT_RADIUS),
  );

  const radius: RadiusValue = isValidRadius(rawRadius) ? rawRadius : DEFAULT_RADIUS;

  function setRadius(newRadius: RadiusValue): void {
    void setRawRadius(newRadius);
  }

  return [radius, setRadius];
}
