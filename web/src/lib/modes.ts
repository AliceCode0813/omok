export type GameMode = "ai" | "online" | "local";
export type ColorChoice = "black" | "white";

export function randomBlackPlayer(hostId: string, guestId: string): {
  player_black: string;
  player_white: string;
} {
  if (Math.random() < 0.5) {
    return { player_black: hostId, player_white: guestId };
  }
  return { player_black: guestId, player_white: hostId };
}

export function nextOnlineColors(
  playerBlack: string | null,
  playerWhite: string | null,
  lastWinner: 0 | 1 | 2,
): { player_black: string; player_white: string } | null {
  if (!playerBlack || !playerWhite || !lastWinner) return null;

  const winnerId = lastWinner === 1 ? playerBlack : playerWhite;
  const loserId = lastWinner === 1 ? playerWhite : playerBlack;

  return {
    player_black: loserId,
    player_white: winnerId,
  };
}
