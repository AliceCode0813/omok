"use client";

import { useMemo } from "react";

import { BOARD_SIZE, type Board, type Player } from "@/lib/game";

interface BoardProps {
  board: Board;
  disabled?: boolean;
  lastMove?: { row: number; col: number } | null;
  onPlace: (row: number, col: number) => void;
}

const STAR_POINTS = [
  [3, 3],
  [3, 11],
  [11, 3],
  [11, 11],
  [7, 7],
] as const;

function preventFocusScroll(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export default function OmokBoard({
  board,
  disabled = false,
  lastMove = null,
  onPlace,
}: BoardProps) {
  const cells = useMemo(
    () =>
      Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
        row: Math.floor(index / BOARD_SIZE),
        col: index % BOARD_SIZE,
      })),
    [],
  );

  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < BOARD_SIZE; i += 1) {
      const p = (i / (BOARD_SIZE - 1)) * 100;
      lines.push({ x1: 0, y1: p, x2: 100, y2: p });
      lines.push({ x1: p, y1: 0, x2: p, y2: 100 });
    }
    return lines;
  }, []);

  const lastMoveLabel = lastMove
    ? `마지막 수: ${lastMove.row + 1}행 ${lastMove.col + 1}열`
    : "마지막 수: -";

  return (
    <div className="mx-auto w-full max-w-[min(98vw,760px)] touch-manipulation">
      <p
        className={`mb-2 min-h-6 text-center text-sm font-semibold ${
          lastMove ? "text-red-600" : "text-transparent"
        }`}
        aria-live="polite"
      >
        {lastMoveLabel}
      </p>

      <div className="relative aspect-square rounded-2xl bg-[#d4a24e] p-[3.5%] shadow-xl ring-2 ring-[#5c3d1e]/40">
        <div className="absolute inset-[3.5%] overflow-hidden rounded-xl border-[3px] border-[#3f2a18] bg-[#dcb168]">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {gridLines.map((line, index) => (
              <line
                key={index}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#3f2a18"
                strokeWidth={0.65}
                vectorEffect="non-scaling-stroke"
                strokeOpacity={0.95}
              />
            ))}
          </svg>

          {STAR_POINTS.map(([row, col]) => (
            <span
              key={`${row}-${col}`}
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2b1a10]"
              style={{
                left: `${(col / (BOARD_SIZE - 1)) * 100}%`,
                top: `${(row / (BOARD_SIZE - 1)) * 100}%`,
              }}
            />
          ))}

          {cells.map(({ row, col }) => {
            const stone = board[row][col] as Player;
            const isLast =
              lastMove?.row === row && lastMove?.col === col && stone !== 0;

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                tabIndex={-1}
                disabled={disabled || stone !== 0}
                onMouseDown={preventFocusScroll}
                onClick={() => onPlace(row, col)}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition disabled:cursor-default"
                style={{
                  left: `${(col / (BOARD_SIZE - 1)) * 100}%`,
                  top: `${(row / (BOARD_SIZE - 1)) * 100}%`,
                  width: `${100 / BOARD_SIZE}%`,
                  height: `${100 / BOARD_SIZE}%`,
                }}
                aria-label={`${row + 1}행 ${col + 1}열`}
              >
                {isLast && (
                  <span className="pointer-events-none absolute inset-0 rounded-full border-[3px] border-red-500 bg-red-500/20 shadow-[0_0_0_4px_rgba(239,68,68,0.25)]" />
                )}

                {stone !== 0 && (
                  <span
                    className={`absolute inset-[8%] rounded-full shadow-md ${
                      stone === 1
                        ? "bg-gradient-to-br from-zinc-800 to-black ring-1 ring-black/50"
                        : "bg-gradient-to-br from-white to-zinc-200 ring-1 ring-zinc-400"
                    } ${isLast ? "ring-4 ring-red-500 ring-offset-1 ring-offset-transparent" : ""}`}
                  />
                )}

                {isLast && (
                  <>
                    <span className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-[115%] w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />
                    <span className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-1 w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
