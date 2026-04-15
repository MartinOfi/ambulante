/**
 * Precisión mínima aceptada en metros. PRD §7.1 — descartar lecturas con mayor error.
 */
export const MIN_ACCURACY_METERS = 50;

/**
 * Factor multiplicador sobre MIN_ACCURACY_METERS: si la lectura es 4x peor que el mínimo,
 * se considera señal GPS imprecisa.
 */
export const POOR_ACCURACY_FACTOR = 4;

export const GEO_TIMEOUT_MS = 10_000;
export const GEO_MAX_AGE_MS = 30_000;

/**
 * Intervalo de publicación de ubicación de la tienda mientras está activa. PRD §7.1.
 */
export const STORE_LOCATION_REFRESH_MS = 45_000;

/**
 * Tolerancia antes de marcar la ubicación de una tienda como "desactualizada". PRD §7.1.
 */
export const STORE_LOCATION_STALE_MS = 120_000;
