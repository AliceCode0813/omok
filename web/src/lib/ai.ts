import {
  BOARD_SIZE,
  checkWin,
  createEmptyBoard,
  type Board,
  type Player,
} from "@/lib/game";

type Stone = 1 | 2;

const CENTER = Math.floor(BOARD_SIZE / 2);

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]) as Board;
}

function countLine(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number,
  stone: Stone,
): number {
  let count = 0;
  let r = row + dr;
  let c = col + dc;
  while (
    r >= 0 &&
    r < BOARD_SIZE &&
    c >= 0 &&
    c < BOARD_SIZE &&
    board[r][c] === stone
  ) {
    count += 1;
    r += dr;
    c += dc;
  }
  return count;
}

function evaluatePoint(
  board: Board,
  row: number,
  col: number,
  stone: Stone,
): number {
  if (board[row][col] !== 0) return -1;

  let score = 0;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;

  for (const [dr, dc] of directions) {
    const forward = countLine(board, row, col, dr, dc, stone);
    const backward = countLine(board, row, col, -dr, -dc, stone);
    const total = forward + backward + 1;

    if (total >= 5) score += 100000;
    else if (total === 4) score += 10000;
    else if (total === 3) score += 1000;
    else if (total === 2) score += 100;
    else score += 10;
  }

  const dist = Math.abs(row - CENTER) + Math.abs(col - CENTER);
  score += Math.max(0, 20 - dist * 2);

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      if (board[r][c] === stone) score += 8;
      if (board[r][c] === (3 - stone)) score += 4;
    }
  }

  return score;
}

function findWinningMove(board: Board, stone: Stone): { row: number; col: number } | null {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== 0) continue;
      const next = cloneBoard(board);
      next[row][col] = stone;
      if (checkWin(next, row, col)) return { row, col };
    }
  }
  return null;
}

function bestScoredMove(board: Board, stone: Stone): { row: number; col: number } | null {
  let best: { row: number; col: number; score: number } | null = null;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const attack = evaluatePoint(board, row, col, stone);
      const defense = evaluatePoint(board, row, col, (3 - stone) as Stone);
      const score = attack + defense * 0.95;
      if (attack < 0) continue;
      if (!best || score > best.score) {
        best = { row, col, score };
      }
    }
  }

  return best ? { row: best.row, col: best.col } : null;
}

export function getAiMove(board: Board, aiStone: Stone): { row: number; col: number } {
  const win = findWinningMove(board, aiStone);
  if (win) return win;

  const block = findWinningMove(board, (3 - aiStone) as Stone);
  if (block) return block;

  const scored = bestScoredMove(board, aiStone);
  if (scored) return scored;

  if (board[CENTER][CENTER] === 0) {
    return { row: CENTER, col: CENTER };
  }

  return { row: CENTER, col: CENTER };
}

export function createAiBoard(): Board {
  return createEmptyBoard();
}

export type { Stone as AiStone, Player };
