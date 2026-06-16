"use client";

import { useEffect, useState } from "react";

import { TURN_SECONDS } from "@/lib/timer";

export function useLocalTurnTimer(
  active: boolean,
  turnKey: string | number,
  onTimeout: () => void,
  seconds = TURN_SECONDS,
): number {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!active) {
      setRemaining(seconds);
      return;
    }

    const startedAt = Date.now();
    setRemaining(seconds);

    const intervalId = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, seconds - elapsed);
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(intervalId);
        onTimeout();
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [active, turnKey, onTimeout, seconds]);

  return remaining;
}

export function useSyncedTurnTimer(
  active: boolean,
  turnStartedAt: string | null | undefined,
  turnKey: string | number,
  onTimeout: () => void,
  seconds = TURN_SECONDS,
): number {
  const [remaining, setRemaining] = useState(seconds);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const intervalId = window.setInterval(() => setTick((value) => value + 1), 250);
    return () => window.clearInterval(intervalId);
  }, [active]);

  useEffect(() => {
    if (!active || !turnStartedAt) {
      setRemaining(seconds);
      return;
    }

    const elapsed = Math.floor(
      (Date.now() - new Date(turnStartedAt).getTime()) / 1000,
    );
    const left = Math.max(0, seconds - elapsed);
    setRemaining(left);
    if (left <= 0) onTimeout();
  }, [active, turnStartedAt, turnKey, tick, onTimeout, seconds]);

  return remaining;
}
