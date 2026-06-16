export const TURN_SECONDS = 60;

export function formatTimer(seconds: number): string {
  const safe = Math.max(0, seconds);
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function getRemainingSeconds(
  turnStartedAt: string | null | undefined,
  limit = TURN_SECONDS,
): number {
  if (!turnStartedAt) return limit;
  const elapsed = Math.floor(
    (Date.now() - new Date(turnStartedAt).getTime()) / 1000,
  );
  return Math.max(0, limit - elapsed);
}
