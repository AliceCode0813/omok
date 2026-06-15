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

  return (
    <div className="mx-auto w-full max-w-[min(92vw,520px)]">
      <div className="relative aspect-square rounded-2xl bg-[#d4a24e] p-[4%] shadow-xl ring-2 ring-[#5c3d1e]/40">
        <div className="absolute inset-[4%] overflow-hidden rounded-xl border-[3px] border-[#3f2a18] bg-[#dcb168]">
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
                strokeWidth={index < BOARD_SIZE ? 0.55 : 0.45}
                vectorEffect="non-scaling-stroke"
                strokeOpacity={0.9}
              />
            ))}
          </svg>

          {STAR_POINTS.map(([row, col]) => (
            <span
              key={`${row}-${col}`}
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2b1a10]"
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
                disabled={disabled || stone !== 0}
                onClick={() => onPlace(row, col)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition disabled:cursor-default"
                style={{
                  left: `${(col / (BOARD_SIZE - 1)) * 100}%`,
                  top: `${(row / (BOARD_SIZE - 1)) * 100}%`,
                  width: `${100 / BOARD_SIZE}%`,
                  height: `${100 / BOARD_SIZE}%`,
                }}
                aria-label={`${row + 1}행 ${col + 1}열`}
              >
                {stone !== 0 && (
                  <span
                    className={`absolute inset-[10%] rounded-full shadow-md ${
                      stone === 1
                        ? "bg-gradient-to-br from-zinc-800 to-black ring-1 ring-black/50"
                        : "bg-gradient-to-br from-white to-zinc-200 ring-1 ring-zinc-400"
                    } ${isLast ? "ring-2 ring-amber-500" : ""}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
