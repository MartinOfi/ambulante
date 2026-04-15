const METERS_IN_KM = 1000;
const DEFAULT_CURRENCY = "ARS";
const LOCALE = "es-AR";

export function formatDistance(meters: number): string {
  if (meters < METERS_IN_KM) return `${Math.round(meters)} m`;
  return `${(meters / METERS_IN_KM).toFixed(1)} km`;
}

export function formatPrice(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
