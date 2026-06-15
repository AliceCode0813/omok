export const BOARD_SIZE = 15;

export type Player = 0 | 1 | 2;
export type Board = Player[][];
export type RoomStatus = "waiting" | "ready" | "playing" | "finished";
export type RoomMode = "online" | "ai" | "local";

export interface Room {
  id: string;
  host_id: string;
  guest_id: string | null;
  player_black: string | null;
  player_white: string | null;
  current_turn: Player;
  status: RoomStatus;
  winner: Player;
  board: Board;
  updated_at: string;
  mode?: RoomMode;
  host_ready?: boolean;
  guest_ready?: boolean;
  last_winner?: Player;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0 as Player),
  );
}

export function checkWin(board: Board, row: number, col: number): boolean {
  const player = board[row][col];
  if (!player) return false;

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;

  for (const [dr, dc] of directions) {
    let count = 1;
    for (const sign of [1, -1] as const) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        board[r][c] === player
      ) {
        count += 1;
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getPlayerRole(
  room: Room,
  playerId: string,
): "black" | "white" | null {
  if (room.player_black === playerId) return "black";
  if (room.player_white === playerId) return "white";
  return null;
}

export function canPlaceStone(room: Room, playerId: string): boolean {
  if (room.status !== "playing" || room.winner) return false;
  const role = getPlayerRole(room, playerId);
  if (!role) return false;
  const expected: Player = role === "black" ? 1 : 2;
  return room.current_turn === expected;
}

export function bothPlayersReady(room: Room): boolean {
  if (!room.guest_id) return false;
  return Boolean(room.host_ready && room.guest_ready);
}
