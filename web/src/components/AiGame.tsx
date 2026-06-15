"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import OmokBoard from "@/components/OmokBoard";
import { getAiMove } from "@/lib/ai";
import {
  checkWin,
  createEmptyBoard,
  type Board,
  type Player,
} from "@/lib/game";
import type { ColorChoice } from "@/lib/modes";

type Phase = "setup" | "ready" | "playing" | "finished";

export default function AiGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [colorChoice, setColorChoice] = useState<ColorChoice>("black");
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<Player>(1);
  const [winner, setWinner] = useState<Player>(0);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(
    null,
  );

  const humanStone: Player = colorChoice === "black" ? 1 : 2;
  const aiStone: Player = colorChoice === "black" ? 2 : 1;
  const isHumanTurn = currentTurn === humanStone && !winner;

  const statusText = useMemo(() => {
    if (phase === "setup") return "흑돌 또는 백돌을 선택하세요";
    if (phase === "ready") return "준비가 되면 시작 버튼을 누르세요";
    if (winner === 1) return humanStone === 1 ? "승리!" : "AI 승리!";
    if (winner === 2) return humanStone === 2 ? "승리!" : "AI 승리!";
    return isHumanTurn ? "내 차례" : "AI가 생각 중...";
  }, [phase, winner, humanStone, isHumanTurn]);

  function resetGame(keepColor = true) {
    setBoard(createEmptyBoard());
    setCurrentTurn(1);
    setWinner(0);
    setLastMove(null);
    setPhase(keepColor ? "ready" : "setup");
  }

  function startGame() {
    setBoard(createEmptyBoard());
    setCurrentTurn(1);
    setWinner(0);
    setLastMove(null);
    setPhase("playing");
  }

  function applyMove(nextBoard: Board, row: number, col: number, stone: Player) {
    setBoard(nextBoard);
    setLastMove({ row, col });

    if (checkWin(nextBoard, row, col)) {
      setWinner(stone);
      setPhase("finished");
      return;
    }

    setCurrentTurn(stone === 1 ? 2 : 1);
  }

  function handleHumanPlace(row: number, col: number) {
    if (phase !== "playing" || !isHumanTurn || board[row][col] !== 0) return;
    const nextBoard = board.map((r) => [...r]) as Board;
    nextBoard[row][col] = humanStone;
    applyMove(nextBoard, row, col, humanStone);
  }

  useEffect(() => {
    if (phase !== "playing" || winner || currentTurn !== aiStone) return;

    const timer = window.setTimeout(() => {
      setBoard((currentBoard) => {
        const move = getAiMove(currentBoard, aiStone);
        if (currentBoard[move.row][move.col] !== 0) return currentBoard;

        const nextBoard = currentBoard.map((r) => [...r]) as Board;
        nextBoard[move.row][move.col] = aiStone;
        setLastMove({ row: move.row, col: move.col });

        if (checkWin(nextBoard, move.row, move.col)) {
          setWinner(aiStone);
          setPhase("finished");
          return nextBoard;
        }

        setCurrentTurn(humanStone);
        return nextBoard;
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [phase, winner, currentTurn, aiStone, humanStone]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 underline">
          모드 선택
        </Link>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow ring-1 ring-black/5">
          AI 대전
        </span>
      </div>

      <div className="rounded-3xl bg-white/90 p-5 shadow-xl ring-1 ring-black/5">
        <p className="text-lg font-bold text-zinc-900">{statusText}</p>
        <p className="mt-1 text-sm text-zinc-600">
          나: {colorChoice === "black" ? "흑돌 (선공)" : "백돌 (후공)"}
        </p>

        {phase === "setup" && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setColorChoice("black")}
              className={`rounded-2xl border px-4 py-4 text-left ${
                colorChoice === "black"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <p className="font-semibold">흑돌</p>
              <p className="mt-1 text-sm opacity-80">먼저 둡니다</p>
            </button>
            <button
              type="button"
              onClick={() => setColorChoice("white")}
              className={`rounded-2xl border px-4 py-4 text-left ${
                colorChoice === "white"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <p className="font-semibold">백돌</p>
              <p className="mt-1 text-sm opacity-80">AI 다음에 둡니다</p>
            </button>
            <button
              type="button"
              onClick={() => setPhase("ready")}
              className="sm:col-span-2 rounded-2xl bg-amber-500 px-4 py-4 font-semibold text-white hover:bg-amber-400"
            >
              다음
            </button>
          </div>
        )}

        {phase === "ready" && (
          <div className="mt-5">
            <button
              type="button"
              onClick={startGame}
              className="w-full rounded-2xl bg-zinc-900 px-4 py-4 text-base font-semibold text-white hover:bg-zinc-800"
            >
              준비 완료 · 시작하기
            </button>
          </div>
        )}

        {(phase === "playing" || phase === "finished") && (
          <>
            <div className="mt-5">
              <OmokBoard
                board={board}
                disabled={!isHumanTurn || !!winner}
                lastMove={lastMove}
                onPlace={handleHumanPlace}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => resetGame(true)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold"
              >
                같은 색으로 다시
              </button>
              <button
                type="button"
                onClick={() => resetGame(false)}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                색 다시 선택
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
