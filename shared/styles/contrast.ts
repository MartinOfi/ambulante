export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export const WCAG_THRESHOLDS = {
  normalText: 4.5,
  largeText: 3.0,
} as const;

export function parseHsl(hslString: string): HslColor {
  const [h, s, l] = hslString.split(" ").map((part) => parseFloat(part));
  return { h, s, l };
}

export function hslToLuminance({ h, s, l }: HslColor): number {
  const sN = s / 100;
  const lN = l / 100;

  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const linearize = (v: number): number => {
    const ch = v + m;
    return ch <= 0.04045 ? ch / 12.92 : Math.pow((ch + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(color1: HslColor, color2: HslColor): number {
  const l1 = hslToLuminance(color1);
  const l2 = hslToLuminance(color2);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
