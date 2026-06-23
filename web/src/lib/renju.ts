import { BOARD_SIZE, type Board, type Player } from "@/lib/game";

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function cloneAndPlace(
  board: Board,
  row: number,
  col: number,
  stone: Player,
): Board | null {
  if (board[row][col] !== 0) return null;
  const next = board.map((r) => [...r]) as Board;
  next[row][col] = stone;
  return next;
}

/** 한 방향에서 (row,col)을 포함한 活三(양쪽 끝이 비어 있는 3) 인지 */
function isOpenThreeInDirection(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number,
  stone: Player,
): boolean {
  let count = 1;

  let fr = row + dr;
  let fc = col + dc;
  while (inBounds(fr, fc) && board[fr][fc] === stone) {
    count += 1;
    fr += dr;
    fc += dc;
  }

  let br = row - dr;
  let bc = col - dc;
  while (inBounds(br, bc) && board[br][bc] === stone) {
    count += 1;
    br -= dr;
    bc -= dc;
  }

  if (count !== 3) return false;

  const forwardOpen = inBounds(fr, fc) && board[fr][fc] === 0;
  const backwardOpen = inBounds(br, bc) && board[br][bc] === 0;
  return forwardOpen && backwardOpen;
}

/** 이 수로 만들어지는 活三 개수 */
export function countOpenThrees(
  board: Board,
  row: number,
  col: number,
  stone: Player,
): number {
  const next = cloneAndPlace(board, row, col, stone);
  if (!next) return 0;

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;

  let total = 0;
  for (const [dr, dc] of directions) {
    if (isOpenThreeInDirection(next, row, col, dr, dc, stone)) {
      total += 1;
    }
  }
  return total;
}

/** 렌주 규칙: 흑(1)의 삼삼 금지 */
export function isDoubleThreeForbidden(
  board: Board,
  row: number,
  col: number,
  stone: Player,
): boolean {
  if (stone !== 1) return false;
  if (board[row][col] !== 0) return false;
  return countOpenThrees(board, row, col, stone) >= 2;
}

export function getForbiddenReason(
  board: Board,
  row: number,
  col: number,
  stone: Player,
): string | null {
  if (isDoubleThreeForbidden(board, row, col, stone)) {
    return "삼삼은 금지입니다 (흑돌)";
  }
  return null;
}
