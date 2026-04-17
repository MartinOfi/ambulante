/**
 * Motion primitives — single source of truth for animation tokens and helpers.
 *
 * Durations and easings are derived from MOTION in tokens.ts to avoid drift.
 * The TRANSITIONS and VARIANT presets are shaped to be compatible with
 * motion/react's Transition and Variants interfaces.
 */

import { MOTION } from "@/shared/styles/tokens";

// ─── Local types (compatible with motion/react when installed) ────────────────

/** Subset of motion/react's Transition — covers tween and spring. */
interface MotionTransition {
  readonly duration?: number;
  readonly ease?: readonly [number, number, number, number] | string;
  readonly type?: "tween" | "spring";
  readonly stiffness?: number;
  readonly damping?: number;
}

/** Compatible with motion/react's target state (a single variant definition). */
interface MotionState {
  readonly opacity?: number;
  readonly x?: number;
  readonly y?: number;
  readonly scale?: number;
  readonly transition?: MotionTransition;
}

/** Compatible with motion/react's Variants interface. */
interface MotionVariants {
  readonly initial: MotionState;
  readonly animate: MotionState;
  readonly exit: MotionState;
}

// ─── Durations ────────────────────────────────────────────────────────────────

/** Durations in seconds for framer-motion (MOTION.durations stores ms). */
export const FM_DURATIONS = {
  fast: MOTION.durations.fast / 1000,
  base: MOTION.durations.base / 1000,
  slow: MOTION.durations.slow / 1000,
} as const;

// ─── Easings ─────────────────────────────────────────────────────────────────

/** Cubic-bezier control points for framer-motion's ease prop. */
export const FM_EASINGS: Record<string, [number, number, number, number]> = {
  easeOut: [0.0, 0.0, 0.58, 1.0],
  easeInOut: [0.42, 0.0, 0.58, 1.0],
  linear: [0, 0, 1, 1],
};

// ─── Transition presets ───────────────────────────────────────────────────────

/**
 * Ready-to-use transition objects.
 * Pass directly as the `transition` prop on motion.* components.
 */
export const TRANSITIONS = {
  fast: {
    duration: FM_DURATIONS.fast,
    ease: FM_EASINGS.easeOut,
  },
  base: {
    duration: FM_DURATIONS.base,
    ease: FM_EASINGS.easeOut,
  },
  slow: {
    duration: FM_DURATIONS.slow,
    ease: FM_EASINGS.easeOut,
  },
  spring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
} satisfies Record<string, MotionTransition>;

// ─── Variant presets ─────────────────────────────────────────────────────────

export const FADE_IN_VARIANTS: MotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: TRANSITIONS.base },
  exit: { opacity: 0, transition: TRANSITIONS.fast },
};

export const SLIDE_UP_VARIANTS: MotionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: TRANSITIONS.base },
  exit: { opacity: 0, y: 8, transition: TRANSITIONS.fast },
};

export const SLIDE_DOWN_VARIANTS: MotionVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0, transition: TRANSITIONS.base },
  exit: { opacity: 0, y: -8, transition: TRANSITIONS.fast },
};

// ─── Tailwind class helpers ───────────────────────────────────────────────────

/**
 * Tailwind class strings for CSS transitions.
 * Values match MOTION.durations: fast=200ms, base=300ms, slow=500ms.
 */
export const TW_TRANSITIONS = {
  fast: "transition duration-200 ease-out",
  base: "transition duration-300 ease-out",
  slow: "transition duration-500 ease-out",
} as const;
