"use client";

import { useEffect, useRef } from "react";

import { TERMINAL_ORDER_STATUSES } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";

const VIBRATION_PATTERN_MS = [200, 100, 200] as const;
const ALERT_TONE_FREQUENCY_HZ = 880;
const ALERT_TONE_DURATION_S = 0.3;
const ALERT_TONE_GAIN_PEAK = 0.3;

function isActionable(order: Order): boolean {
  return !TERMINAL_ORDER_STATUSES.includes(order.status);
}

function countActionable(orders: readonly Order[]): number {
  return orders.filter(isActionable).length;
}

function playAlertTone(): void {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(ALERT_TONE_FREQUENCY_HZ, ctx.currentTime);
    gain.gain.setValueAtTime(ALERT_TONE_GAIN_PEAK, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ALERT_TONE_DURATION_S);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + ALERT_TONE_DURATION_S);
  } catch {
    // AudioContext unavailable in some environments — fail silently
  }
}

export function useNewOrderAlert(orders: readonly Order[]): void {
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    const current = countActionable(orders);

    if (prevCountRef.current === null) {
      prevCountRef.current = current;
      return;
    }

    if (current > prevCountRef.current) {
      navigator.vibrate?.(VIBRATION_PATTERN_MS as unknown as number[]);
      playAlertTone();
    }

    prevCountRef.current = current;
  }, [orders]);
}
