"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import OmokBoard from "@/components/OmokBoard";
import TurnTimer from "@/components/TurnTimer";
import {
  checkWin,
  createEmptyBoard,
  getResultMessage,
  type Board,
  type Player,
} from "@/lib/game";
import { getForbiddenReason } from "@/lib/renju";
import { useLocalTurnTimer } from "@/hooks/useTurnTimer";

type Phase = "ready" | "playing" | "finished";
type EndReason = "timeout" | "normal" | null;

export default function LocalGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<Player>(1);
  const [winner, setWinner] = useState<Player>(0);
  const [endReason, setEndReason] = useState<EndReason>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [error, setError] = useState("");

  const handleTimeout = useCallback(() => {
    if (phase !== "playing" || winner) return;
    setWinner(currentTurn === 1 ? 2 : 1);
    setEndReason("timeout");
    setPhase("finished");
  }, [phase, winner, currentTurn]);

  const remaining = useLocalTurnTimer(
    phase === "playing" && !winner,
    `${currentTurn}-${lastMove?.row ?? "x"}-${lastMove?.col ?? "y"}`,
    handleTimeout,
  );

  const statusText = useMemo(() => {
    if (phase === "ready") return "두 명이 번갈아 둡니다. 준비되면 시작하세요";
    if (winner) {
      return getResultMessage({
        winner,
        endReason,
        blackLabel: "흑돌",
        whiteLabel: "백돌",
      });
    }
    return currentTurn === 1
      ? "흑돌 차례 · 1분 · 삼삼 금지"
      : "백돌 차례 · 1분";
  }, [phase, winner, endReason, currentTurn]);

  function startGame() {
    setBoard(createEmptyBoard());
    setCurrentTurn(1);
    setWinner(0);
    setEndReason(null);
    setLastMove(null);
    setPhase("playing");
  }

  function handlePlace(row: number, col: number) {
    if (phase !== "playing" || winner || board[row][col] !== 0) return;

    const forbidden = getForbiddenReason(board, row, col, currentTurn);
    if (forbidden) {
      setError(forbidden);
      return;
    }
    setError("");

    const nextBoard = board.map((r) => [...r]) as Board;
    nextBoard[row][col] = currentTurn;
    setBoard(nextBoard);
    setLastMove({ row, col });

    if (checkWin(nextBoard, row, col)) {
      setWinner(currentTurn);
      setEndReason("normal");
      setPhase("finished");
      return;
    }

    setCurrentTurn(currentTurn === 1 ? 2 : 1);
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-6">
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
              <TurnTimer
                remaining={remaining}
                active={phase === "playing" && !winner}
                label={
                  phase === "finished"
                    ? "게임 종료"
                    : currentTurn === 1
                      ? "흑돌 남은 시간"
                      : "백돌 남은 시간"
                }
              />
              <OmokBoard
                board={board}
                disabled={!!winner}
                lastMove={lastMove}
                onPlace={handlePlace}
              />
            </div>
            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
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
