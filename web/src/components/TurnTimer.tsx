"use client";

import { formatTimer, TURN_SECONDS } from "@/lib/timer";

interface TurnTimerProps {
  remaining: number;
  label?: string;
  active?: boolean;
}

export default function TurnTimer({
  remaining,
  label = "남은 시간",
  active = true,
}: TurnTimerProps) {
  const urgent = active && remaining <= 10;
  const displayTime = active ? formatTimer(remaining) : formatTimer(TURN_SECONDS);

  return (
    <div className="mb-4 min-h-[60px]">
      <div
        className={`flex h-[60px] items-center justify-between rounded-2xl px-4 py-3 transition-colors ${
          !active
            ? "bg-zinc-50 text-zinc-400"
            : urgent
              ? "bg-red-50 text-red-700"
              : "bg-zinc-100 text-zinc-800"
        }`}
      >
        <span className="text-sm font-medium">{label}</span>
        <span className="text-2xl font-bold tabular-nums">{displayTime}</span>
      </div>
    </div>
  );
}
