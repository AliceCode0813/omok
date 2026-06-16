"use client";

import { formatTimer } from "@/lib/timer";

interface TurnTimerProps {
  remaining: number;
  label?: string;
}

export default function TurnTimer({ remaining, label = "남은 시간" }: TurnTimerProps) {
  const urgent = remaining <= 10;

  return (
    <div
      className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-3 ${
        urgent ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-800"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${urgent ? "animate-pulse" : ""}`}>
        {formatTimer(remaining)}
      </span>
    </div>
  );
}
