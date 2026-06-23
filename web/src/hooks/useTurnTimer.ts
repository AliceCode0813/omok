"use client";

import { useEffect, useRef, useState } from "react";

import { TURN_SECONDS } from "@/lib/timer";

export function useLocalTurnTimer(
  active: boolean,
  turnKey: string | number,
  onTimeout: () => void,
  seconds = TURN_SECONDS,
): number {
  const [remaining, setRemaining] = useState(seconds);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

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
        onTimeoutRef.current();
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [active, turnKey, seconds]);

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
  const [localStart, setLocalStart] = useState<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const firedRef = useRef(false);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    firedRef.current = false;
    if (!active) {
      setLocalStart(null);
      setRemaining(seconds);
      return;
    }
    if (turnStartedAt) {
      setLocalStart(null);
    } else {
      setLocalStart(Date.now());
    }
  }, [active, turnKey, turnStartedAt, seconds]);

  useEffect(() => {
    if (!active) return;

    const intervalId = window.setInterval(() => {
      const startMs = turnStartedAt
        ? new Date(turnStartedAt).getTime()
        : (localStart ?? Date.now());

      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const left = Math.max(0, seconds - elapsed);
      setRemaining(left);

      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeoutRef.current();
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [active, turnStartedAt, localStart, turnKey, seconds]);

  return remaining;
}
