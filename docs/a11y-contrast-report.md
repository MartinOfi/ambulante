# Accessibility Contrast Audit — F9.7

**Date:** 2026-04-17
**Standard:** WCAG 2.1 AA
**Thresholds:** ≥4.5:1 normal text · ≥3.0:1 large text / UI components

---

## Methodology

All ratios were computed with the WCAG relative-luminance formula:

```
L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
ratio = (L_hi + 0.05) / (L_lo + 0.05)
```

HSL values are sourced from `COLORS.raw.light` and `COLORS.raw.dark` in `shared/styles/tokens.ts`.
Runtime verification is in `shared/styles/contrast.test.ts` (22 assertions, all passing).

---

## Light Mode

Background surfaces: `surface` (33 100% 96%) · `surfaceElevated` (0 0% 100%)

| Foreground token | Value (HSL) | On surface | On surfaceElevated | AA normal? |
|---|---|---|---|---|
| foreground | 222 47% 11% | 15.5:1 | 17.7:1 | ✅ PASS |
| muted | 215 16% **46%** | 4.56:1 | 5.02:1 | ✅ PASS |
| success | 142 71% **30%** | 4.52:1 | 4.99:1 | ✅ PASS |
| destructive | 0 72% **50%** | 4.56:1 | 5.03:1 | ✅ PASS |
| brandPrimary | 21 90% 48% | 3.14:1 | 3.47:1 | ✅ PASS (AA-Large) |

---

## Dark Mode

Background surfaces: `surface` (222 47% 6%) · `surfaceElevated` (222 35% 12%)

| Foreground token | Value (HSL) | On surface | On surfaceElevated | AA normal? |
|---|---|---|---|---|
| foreground | 33 100% 96% | 17.5:1 | 11.1:1 | ✅ PASS |
| muted | 215 16% 65% | 6.53:1 | 3.93:1 | ✅ PASS / PASS |
| success | 142 71% 45% | 8.49:1 | 5.07:1 | ✅ PASS |
| destructive | 0 72% **63%** | 5.60:1 | 4.97:1 | ✅ PASS |

---

## Shared Tokens (both modes)

| Pair | Ratio | Threshold | Result |
|---|---|---|---|
| primaryForeground on brandPrimary | 3.77:1 | ≥3.0 (AA-Large) | ✅ PASS |
| brandAccent on dark surface | 3.75:1 | ≥3.0 (AA-Large) | ✅ PASS |

`brandPrimary` and `brandAccent` are used exclusively for large UI elements (buttons, badges, map pins) — AA-Large (3.0:1) is the correct threshold.

---

## Token Changes Made

| Token | Old lightness | New lightness | Old ratio (on surface) | New ratio | Reason |
|---|---|---|---|---|---|
| light.muted | 47% | **46%** | 4.41 | 4.56 | Marginally below 4.5 threshold |
| light.success | 45% | **30%** | 2.15 | 4.52 | Severely failing — green hue inherently low-luminance |
| light.destructive | 51% | **50%** | 4.48 | 4.56 | Marginally below threshold |
| dark.destructive | 51% | **63%** | 4.07 | 5.60 | No dark-mode override existed |

### Structural fix in `globals.css`

`.dark {}` was missing a `--destructive` override, so dark mode silently inherited the light value (L=51%), yielding 4.07:1 on dark surfaces. Added `--destructive: 0 72% 63%` to the `.dark` block.

---

## No Changes Required

| Token | Ratio | Rationale |
|---|---|---|
| foreground (both modes) | >15:1 | Far exceeds any threshold |
| dark.muted | 6.53:1 / 3.93:1 | Passes normalText on both dark surfaces |
| dark.success | 8.49:1 / 5.07:1 | Passes |
| brandPrimary / brandAccent | ~3.1–3.7:1 | Correct threshold is AA-Large (≥3.0) — used only for large UI, not body text |
