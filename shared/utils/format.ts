const METERS_IN_KM = 1000;
const DEFAULT_CURRENCY = "ARS";
const LOCALE = "es-AR";

const PRICE_FORMAT_CACHE = new Map<string, Intl.NumberFormat>();

export function formatDistance(meters: number): string {
  if (meters < METERS_IN_KM) return `${Math.round(meters)} m`;
  return `${(meters / METERS_IN_KM).toFixed(1)} km`;
}

export function formatPrice(amount: number, currency: string = DEFAULT_CURRENCY): string {
  let fmt = PRICE_FORMAT_CACHE.get(currency);
  if (fmt === undefined) {
    fmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency, maximumFractionDigits: 0 });
    PRICE_FORMAT_CACHE.set(currency, fmt);
  }
  return fmt.format(amount);
}
