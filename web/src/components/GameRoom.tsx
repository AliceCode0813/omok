"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import OmokBoard from "@/components/OmokBoard";
import {
  canPlaceStone,
  checkWin,
  createEmptyBoard,
  getPlayerRole,
  type Board,
  type Room,
} from "@/lib/game";
import { getPlayerId } from "@/lib/player";
import { getSupabase } from "@/lib/supabase";

interface GameRoomProps {
  roomId: string;
}

function normalizeRoom(raw: Room): Room {
  return {
    ...raw,
    board: raw.board as Board,
    current_turn: Number(raw.current_turn) as Room["current_turn"],
    winner: Number(raw.winner) as Room["winner"],
  };
}

export default function GameRoom({ roomId }: GameRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/game/${roomId}`;
  }, [roomId]);

  const loadRoom = useCallback(async () => {
    const supabase = getSupabase();
    const { data, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!data) throw new Error("방을 찾을 수 없습니다.");
    setRoom(normalizeRoom(data as Room));
  }, [roomId]);

  useEffect(() => {
    setPlayerId(getPlayerId());
  }, []);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null =
      null;

    async function ensureJoined(currentRoom: Room, currentPlayerId: string) {
      if (
        currentRoom.host_id !== currentPlayerId &&
        !currentRoom.guest_id
      ) {
        const supabase = getSupabase();
        const { error: joinError } = await supabase
          .from("rooms")
          .update({
            guest_id: currentPlayerId,
            player_white: currentPlayerId,
            status: "playing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId)
          .is("guest_id", null);

        if (joinError) throw joinError;
      }
    }

    async function init() {
      try {
        const currentPlayerId = getPlayerId();
        await loadRoom();

        const supabase = getSupabase();
        const { data } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .maybeSingle();

        if (data) {
          await ensureJoined(normalizeRoom(data as Room), currentPlayerId);
          const { data: refreshed } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", roomId)
            .maybeSingle();
          if (refreshed) {
            setRoom(normalizeRoom(refreshed as Room));
          }
        }

        channel = supabase
          .channel(`room-${roomId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "rooms",
              filter: `id=eq.${roomId}`,
            },
            (payload) => {
              if (payload.new) {
                setRoom(normalizeRoom(payload.new as Room));
              }
            },
          )
          .subscribe();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "게임을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (channel) {
        getSupabase().removeChannel(channel);
      }
    };
  }, [loadRoom, roomId]);

  const role = room ? getPlayerRole(room, playerId) : null;
  const isMyTurn = room ? canPlaceStone(room, playerId) : false;

  const statusText = useMemo(() => {
    if (!room) return "불러오는 중...";
    if (room.winner === 1) return "흑돌 승리!";
    if (room.winner === 2) return "백돌 승리!";
    if (room.status === "waiting") return "상대를 기다리는 중...";
    if (!role) return "관전 중";
    if (isMyTurn) return "내 차례입니다";
    return "상대 차례입니다";
  }, [room, role, isMyTurn]);

  async function handlePlace(row: number, col: number) {
    if (!room || !role || !isMyTurn || room.board[row][col] !== 0) return;

    const stone = role === "black" ? 1 : 2;
    const nextBoard = room.board.map((boardRow) => [...boardRow]) as Board;
    nextBoard[row][col] = stone;

    const winner = checkWin(nextBoard, row, col) ? stone : 0;
    const nextTurn = stone === 1 ? 2 : 1;

    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          board: nextBoard,
          current_turn: winner ? stone : nextTurn,
          winner,
          status: winner ? "finished" : "playing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId)
        .eq("current_turn", room.current_turn);

      if (updateError) throw updateError;
      setLastMove({ row, col });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "착수에 실패했습니다.",
      );
      await loadRoom();
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function resetRoom() {
    if (!room || room.host_id !== playerId) return;

    const supabase = getSupabase();
    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        board: createEmptyBoard(),
        current_turn: 1,
        winner: 0,
        status: room.guest_id ? "playing" : "waiting",
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setLastMove(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center px-5 py-10">
        <p className="text-zinc-600">게임을 불러오는 중...</p>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-5 py-10">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">{error}</p>
        <Link href="/" className="mt-4 text-center text-sm underline">
          로비로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/" className="text-sm text-zinc-500 underline">
          로비
        </Link>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow ring-1 ring-black/5">
          방 코드 <span className="tracking-[0.25em]">{roomId}</span>
        </div>
      </div>

      <div className="rounded-3xl bg-white/90 p-5 shadow-xl ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-zinc-900">{statusText}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {role === "black" && "나: 흑돌"}
              {role === "white" && "나: 백돌"}
              {!role && "이 방의 플레이어가 아닙니다"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyInvite}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400"
            >
              {copied ? "링크 복사됨" : "초대 링크 복사"}
            </button>
            {room.host_id === playerId && (
              <button
                type="button"
                onClick={resetRoom}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                새 게임
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <OmokBoard
            board={room.board}
            disabled={!isMyTurn || room.status !== "playing" || !!room.winner}
            lastMove={lastMove}
            onPlace={handlePlace}
          />
        </div>

        <div className="mt-5 grid gap-2 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
          <p>흑돌: {room.player_black ? "준비됨" : "대기"}</p>
          <p>백돌: {room.player_white ? "준비됨" : "대기"}</p>
          <p>같은 방 링크를 친구에게내면 바로 참가할 수 있습니다.</p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
