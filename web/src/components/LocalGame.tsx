"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import OmokBoard from "@/components/OmokBoard";
import {
  checkWin,
  createEmptyBoard,
  type Board,
  type Player,
} from "@/lib/game";

type Phase = "ready" | "playing" | "finished";

export default function LocalGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<Player>(1);
  const [winner, setWinner] = useState<Player>(0);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(
    null,
  );

  const statusText = useMemo(() => {
    if (phase === "ready") return "두 명이 번갈아 둡니다. 준비되면 시작하세요";
    if (winner === 1) return "흑돌 승리!";
    if (winner === 2) return "백돌 승리!";
    return currentTurn === 1 ? "흑돌 차례" : "백돌 차례";
  }, [phase, winner, currentTurn]);

  function startGame() {
    setBoard(createEmptyBoard());
    setCurrentTurn(1);
    setWinner(0);
    setLastMove(null);
    setPhase("playing");
  }

  function handlePlace(row: number, col: number) {
    if (phase !== "playing" || winner || board[row][col] !== 0) return;

    const nextBoard = board.map((r) => [...r]) as Board;
    nextBoard[row][col] = currentTurn;
    setBoard(nextBoard);
    setLastMove({ row, col });

    if (checkWin(nextBoard, row, col)) {
      setWinner(currentTurn);
      setPhase("finished");
      return;
    }

    setCurrentTurn(currentTurn === 1 ? 2 : 1);
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 underline">
          모드 선택
        </Link>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow ring-1 ring-black/5">
          2인 같은 기기
        </span>
      </div>

      <div className="rounded-3xl bg-white/90 p-5 shadow-xl ring-1 ring-black/5">
        <p className="text-lg font-bold text-zinc-900">{statusText}</p>

        {phase === "ready" && (
          <button
            type="button"
            onClick={startGame}
            className="mt-5 w-full rounded-2xl bg-zinc-900 px-4 py-4 text-base font-semibold text-white hover:bg-zinc-800"
          >
            준비 완료 · 시작하기
          </button>
        )}

        {(phase === "playing" || phase === "finished") && (
          <>
            <div className="mt-5">
              <OmokBoard
                board={board}
                disabled={!!winner}
                lastMove={lastMove}
                onPlace={handlePlace}
              />
            </div>
            <button
              type="button"
              onClick={startGame}
              className="mt-4 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold"
            >
              새 게임
            </button>
          </>
        )}
      </div>
    </main>
  );
}
