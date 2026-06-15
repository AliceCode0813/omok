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

  return (
    <div className="mx-auto w-full max-w-[min(92vw,520px)]">
      <div
        className="relative aspect-square rounded-2xl bg-[#d9b26d] p-[3.5%] shadow-xl ring-1 ring-black/10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: `${100 / (BOARD_SIZE - 1)}% ${100 / (BOARD_SIZE - 1)}%`,
        }}
      >
        <div className="absolute inset-[3.5%]">
          {STAR_POINTS.map(([row, col]) => (
            <span
              key={`${row}-${col}`}
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70"
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
                    className={`absolute inset-[12%] rounded-full shadow-md ${
                      stone === 1
                        ? "bg-gradient-to-br from-zinc-700 to-black"
                        : "bg-gradient-to-br from-white to-zinc-200 ring-1 ring-zinc-300"
                    } ${isLast ? "ring-2 ring-amber-400" : ""}`}
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
