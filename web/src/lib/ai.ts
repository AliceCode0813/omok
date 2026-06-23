import {
  BOARD_SIZE,
  checkWin,
  createEmptyBoard,
  type Board,
  type Player,
} from "@/lib/game";
import { isDoubleThreeForbidden } from "@/lib/renju";

export type AiDifficulty = "normal" | "hard";
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

function hasNeighbor(board: Board, row: number, col: number, radius = 2): boolean {
  for (let dr = -radius; dr <= radius; dr += 1) {
    for (let dc = -radius; dc <= radius; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      if (board[r][c] !== 0) return true;
    }
  }
  return false;
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

    if (total >= 5) score += 1_000_000;
    else if (total === 4) score += 120_000;
    else if (total === 3) score += 12_000;
    else if (total === 2) score += 1_200;
    else score += 40;
  }

  const dist = Math.abs(row - CENTER) + Math.abs(col - CENTER);
  score += Math.max(0, 30 - dist * 2);

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      if (board[r][c] === stone) score += 15;
      if (board[r][c] === (3 - stone)) score += 10;
    }
  }

  return score;
}

function findWinningMove(
  board: Board,
  stone: Stone,
): { row: number; col: number } | null {
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

function getCandidateMoves(board: Board): { row: number; col: number }[] {
  const moves: { row: number; col: number }[] = [];
  let hasStone = false;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== 0) hasStone = true;
    }
  }

  if (!hasStone) return [{ row: CENTER, col: CENTER }];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === 0 && hasNeighbor(board, row, col, 2)) {
        moves.push({ row, col });
      }
    }
  }

  return moves.length ? moves : [{ row: CENTER, col: CENTER }];
}

function filterLegalMoves(
  board: Board,
  moves: { row: number; col: number }[],
  stone: Stone,
): { row: number; col: number }[] {
  if (stone !== 1) return moves;
  const legal = moves.filter(
    (m) => !isDoubleThreeForbidden(board, m.row, m.col, 1),
  );
  return legal.length ? legal : moves;
}

function bestScoredMove(
  board: Board,
  stone: Stone,
): { row: number; col: number } | null {
  let best: { row: number; col: number; score: number } | null = null;

  for (const { row, col } of filterLegalMoves(board, getCandidateMoves(board), stone)) {
    const attack = evaluatePoint(board, row, col, stone);
    const defense = evaluatePoint(board, row, col, (3 - stone) as Stone);
    const score = attack * 1.05 + defense;
    if (!best || score > best.score) {
      best = { row, col, score };
    }
  }

  return best;
}

function evaluateBoard(board: Board, aiStone: Stone): number {
  let score = 0;
  const humanStone = (3 - aiStone) as Stone;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === 0) continue;
      const stone = board[row][col] as Stone;
      const value = evaluatePoint(board, row, col, stone);
      score += stone === aiStone ? value : -value * 1.05;
    }
  }

  return score;
}

function minimax(
  board: Board,
  depth: number,
  aiStone: Stone,
  maximizing: boolean,
  alpha: number,
  beta: number,
): number {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const stone = board[row][col];
      if (!stone) continue;
      if (checkWin(board, row, col)) {
        return stone === aiStone ? 10_000_000 + depth : -10_000_000 - depth;
      }
    }
  }

  if (depth === 0) return evaluateBoard(board, aiStone);

  const currentStone = maximizing ? aiStone : ((3 - aiStone) as Stone);
  const candidates = filterLegalMoves(board, getCandidateMoves(board), currentStone)
    .map((move) => ({
      ...move,
      score: evaluatePoint(board, move.row, move.col, currentStone),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (!candidates.length) return evaluateBoard(board, aiStone);

  if (maximizing) {
    let value = -Infinity;
    for (const move of candidates) {
      const next = cloneBoard(board);
      next[move.row][move.col] = currentStone;
      value = Math.max(
        value,
        minimax(next, depth - 1, aiStone, false, alpha, beta),
      );
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of candidates) {
    const next = cloneBoard(board);
    next[move.row][move.col] = currentStone;
    value = Math.min(
      value,
      minimax(next, depth - 1, aiStone, true, alpha, beta),
    );
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

function getHardMove(board: Board, aiStone: Stone): { row: number; col: number } {
  const win = findWinningMove(board, aiStone);
  if (win) return win;

  const block = findWinningMove(board, (3 - aiStone) as Stone);
  if (block) return block;

  let bestMove =
    filterLegalMoves(board, getCandidateMoves(board), aiStone)[0] ??
    { row: CENTER, col: CENTER };
  let bestScore = -Infinity;

  const candidates = filterLegalMoves(board, getCandidateMoves(board), aiStone)
    .map((move) => ({
      ...move,
      score:
        evaluatePoint(board, move.row, move.col, aiStone) +
        evaluatePoint(board, move.row, move.col, (3 - aiStone) as Stone),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  for (const move of candidates) {
    const next = cloneBoard(board);
    next[move.row][move.col] = aiStone;
    const score = minimax(next, 2, aiStone, false, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export function getAiMove(
  board: Board,
  aiStone: Stone,
  difficulty: AiDifficulty = "normal",
): { row: number; col: number } {
  if (difficulty === "hard") {
    return getHardMove(board, aiStone);
  }

  const win = findWinningMove(board, aiStone);
  if (win) return win;

  const block = findWinningMove(board, (3 - aiStone) as Stone);
  if (block) return block;

  const scored = bestScoredMove(board, aiStone);
  if (scored) return scored;

  return { row: CENTER, col: CENTER };
}

export function createAiBoard(): Board {
  return createEmptyBoard();
}

export type { Stone as AiStone, Player };
