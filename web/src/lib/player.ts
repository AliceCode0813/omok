const PLAYER_ID_KEY = "omok-player-id";

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
}
